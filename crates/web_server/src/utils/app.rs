use super::config::Routes;
use super::{
  common::AppState,
  middlewares::{auth_middleware, set_global_header_middleware},
};
use crate::controller;
use axum::{
  Router,
  body::Body,
  extract::rejection::JsonRejection,
  http::StatusCode,
  middleware::{from_fn_with_state, map_response},
  response::{IntoResponse, Response},
  routing::{get, post},
};
use common::{
  errors::{DashboardError, DatabaseError, MetadataError, UserError},
  response::BizResult,
};
use thiserror::Error;
use tower_http::{
  cors::{Any, CorsLayer},
  trace::{self, TraceLayer},
};
use tracing::Level;
use validator::ValidationErrors;

impl IntoResponse for AppError {
  fn into_response(self) -> Response<Body> {
    let (status, message) = match &self {
      AppError::Render(_) => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
      AppError::Database(_) => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
      AppError::Metadata(_) => (StatusCode::INTERNAL_SERVER_ERROR, self.to_string()),
      AppError::Dashboard(_) => (StatusCode::NOT_FOUND, self.to_string()),
      AppError::User(_) => (StatusCode::UNAUTHORIZED, self.to_string()),
      AppError::Validation(_) => (StatusCode::BAD_REQUEST, self.to_string()),
      AppError::AxumJsonRejection(_) => (StatusCode::BAD_REQUEST, self.to_string()),
    };
    let biz_result = BizResult::<()>::err(Some(status.as_u16())).with_message(message);

    let body = biz_result.to_string().unwrap_or_else(|e| {
      format!(
        r#"{{"code": {},"message": "{}", "success": false}}"#,
        BizResult::<()>::BIZ_ERROR,
        e.to_string()
      )
    });

    Response::builder()
      .status(status)
      .header("Content-Type", "application/json")
      .body(Body::from(body))
      .unwrap()
  }
}

pub fn create_app(state: AppState) -> Router {
  let router = Router::new()
    .route(Routes::Root.as_str(), get(controller::root::main))
    .route(
      Routes::DownloadCode.as_str(),
      post(controller::download::download_code),
    )
    .route(Routes::Login.as_str(), post(controller::user::login))
    .route(Routes::Register.as_str(), post(controller::user::register))
    .route(Routes::UserFind.as_str(), get(controller::user::find))
    .route(
      Routes::EmailSendCode.as_str(),
      post(controller::email_code::send_email_code),
    )
    .route(Routes::Auth.as_str(), get(controller::auth::certification))
    .route(
      Routes::MetadataFindByTableName.as_str(),
      post(controller::metadata_info::find_by_table_name),
    );

  Router::new()
    .nest(&state.config.server_root_path, router)
    // 添加全局响应头中间件
    .layer(map_response(set_global_header_middleware))
    // 认证
    .layer(from_fn_with_state(state.clone(), auth_middleware))
    // 添加请求响应跟踪层
    .layer(
      TraceLayer::new_for_http()
        .make_span_with(trace::DefaultMakeSpan::new().level(Level::INFO))
        .on_response(trace::DefaultOnResponse::new().level(Level::INFO))
        .on_request(trace::DefaultOnRequest::new().level(Level::INFO)),
    )
    .layer(
      CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any),
    )
    .with_state(state)
}

#[derive(Debug, Error)]
pub enum AppError {
  #[error("模板渲染错误: {0}")]
  Render(#[from] askama::Error),

  #[error("数据库错误: {0}")]
  Database(#[from] DatabaseError),

  #[error("仪表盘错误: {0}")]
  Dashboard(#[from] DashboardError),

  #[error("元数据错误: {0}")]
  Metadata(#[from] MetadataError),

  #[error("{0}")]
  User(#[from] UserError),

  #[error(transparent)]
  Validation(#[from] ValidationErrors),

  #[error(transparent)]
  AxumJsonRejection(#[from] JsonRejection),
}
