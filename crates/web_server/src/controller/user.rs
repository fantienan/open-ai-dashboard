use crate::utils::jwt::generate_token;
use crate::utils::{app::AppError, common::AppState};
use axum::Extension;
use axum::http::header::AUTHORIZATION;
use axum::response::IntoResponse;
use axum::{Json, extract::State};
use chrono::Utc;
use common::errors::UserError;
use common::{chrono::string_to_date_time, response::BizResult};
use sea_orm::DbConn;
use serde::Deserialize;
use web_server_entity::email_code::Model as EmailCodeModel;
use web_server_entity::user::Model;

pub async fn login(
  state: State<AppState>,
  Json(payload): Json<LoginParams>,
) -> Result<impl IntoResponse, AppError> {
  // 查询
  let email_code_model =
    EmailCodeModel::find_by_email_and_code(&state.db, &payload.email, &payload.code)
      .await
      .map_err(|e| UserError::LoginFailed(e.to_string()))?
      .ok_or_else(|| UserError::LoginFailed("验证码不存在".to_string()))?;

  if email_code_model.consumed_at.is_some() {
    return Err(UserError::LoginFailed("验证码已被使用".to_string()).into());
  }

  let created_at = string_to_date_time(&email_code_model.created_at)
    .map_err(|e| UserError::LoginFailed(format!("无效的日期格式: {}", e)))?;

  // 计算时间差值
  let elapsed = Utc::now().signed_duration_since(created_at).num_seconds();

  // 校验邮箱验证码是否失效
  if elapsed > state.config.email_code_validity {
    EmailCodeModel::delete_expired_codes(&state.db, state.config.email_code_validity.clone())
      .await
      .map_err(|e| UserError::LoginFailed(e.to_string()))?;
    return Err(UserError::LoginFailed("验证码已失效".to_string()).into());
  }

  // 更新
  EmailCodeModel::update_consumed_at_by_email_and_code(
    &state.db,
    &email_code_model.email,
    &email_code_model.code,
  )
  .await
  .map_err(|e| UserError::LoginFailed(e.to_string()))?;

  let user_model = find_or_create_user(&state.db, Json(payload))
    .await
    .map_err(|e| UserError::LoginFailed(e.to_string()))?
    .ok_or_else(|| UserError::LoginFailed("用户不存在".to_string()))?;

  let token = generate_token(&user_model.id, &state.keypair.private_key)
    .map_err(|e| UserError::LoginFailed(format!("生成token失败: {}", e.to_string())))?;

  Ok((
    [(AUTHORIZATION, format!("Bearer {}", token))],
    Json(BizResult::ok(Some(Model::from(user_model))).with_message("登录成功")),
  ))
}

#[derive(Deserialize)]
pub struct LoginParams {
  email: String,
  code: String,
}

async fn find_or_create_user(
  db: &DbConn,
  Json(payload): Json<LoginParams>,
) -> Result<Option<Model>, AppError> {
  let email = &payload.email;
  let user_model_option = Model::find_by_email(db, email)
    .await
    .map_err(|e| UserError::LoginFailed(e.to_string()))?;

  if let Some(model) = user_model_option {
    Ok(Some(Model::from(model)))
  } else {
    let new_model = Model::insert(db, email.to_string())
      .await
      .map_err(|e| UserError::LoginFailed(e.to_string()))?;
    Ok(Some(Model::from(new_model)))
  }
}

pub async fn register(
  state: State<AppState>,
  Json(payload): Json<LoginParams>,
) -> Result<impl IntoResponse, AppError> {
  let model = Model::insert(&state.db, payload.email.to_string())
    .await
    .map_err(|e| UserError::LoginFailed(e.to_string()))?;

  Ok(Json(
    BizResult::ok(Some(Model::from(model))).with_message("注册成功"),
  ))
}

pub async fn find(
  State(state): State<AppState>,
  Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, AppError> {
  let model = Model::find_by_id(&state.db, &user_id)
    .await
    .map_err(|e| UserError::QueryFailed(e.to_string()))?
    .ok_or_else(|| UserError::QueryFailed("用户不存在".to_string()))?;

  Ok(Json(
    BizResult::ok(Some(Model::from(model))).with_message("查询成功"),
  ))
}
