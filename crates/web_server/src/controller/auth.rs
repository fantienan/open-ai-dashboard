use crate::utils::{app::AppError, common::AppState};
use axum::{Extension, Json, extract::State, response::IntoResponse};
use common::{errors::UserError, response::BizResult};
use serde::Serialize;
use web_server_entity::user::Model;

pub async fn certification(
  State(state): State<AppState>,

  Extension(user_id): Extension<String>,
) -> Result<impl IntoResponse, AppError> {
  let model = Model::find_by_id(&state.db, &user_id)
    .await
    .map_err(|e| UserError::QueryFailed(e.to_string()))?
    .ok_or_else(|| UserError::QueryFailed("用户不存在".to_string()))?;
  Ok(Json(BizResult::ok(Some(Certification::new(model)))))
}

#[derive(Debug, Serialize)]
pub struct Certification {
  pub user: Model,
}

impl Certification {
  pub fn new(user: Model) -> Self {
    Certification { user }
  }
}
