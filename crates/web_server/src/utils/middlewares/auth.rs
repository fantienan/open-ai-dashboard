use crate::utils::config::Routes;

use super::super::{common::AppState, jwt::Claims};
use axum::{
  Json,
  extract::{Request, State},
  http::{StatusCode, header::AUTHORIZATION},
  middleware::Next,
  response::{IntoResponse, Response},
};
use common::response::BizResult;
use jsonwebtoken::{DecodingKey, Validation, decode};
use once_cell::sync::Lazy;
use std::collections::HashSet;

// 定义不需要认证的路径白名单
static PUBLIC_PATHS: Lazy<HashSet<&'static str>> = Lazy::new(|| {
  let mut set = HashSet::new();
  set.insert(Routes::Login.as_str());
  set.insert(Routes::Register.as_str());
  set.insert(Routes::EmailSendCode.as_str());
  // 可以添加更多公开路径
  set
});

pub async fn auth_middleware(
  State(state): State<AppState>,
  mut request: Request,
  next: Next,
) -> Result<impl IntoResponse, Response> {
  // 获取请求路径
  let path = request.uri().path();
  let base_path = &state.config.server_root_path;

  // 处理基础路径
  let relative_path = if path.starts_with(base_path) && base_path != "/" {
    path.strip_prefix(base_path).unwrap_or(path)
  } else {
    path
  };

  // 检查是否在白名单中
  if PUBLIC_PATHS.contains(relative_path) {
    // 如果在白名单中，直接放行
    return Ok(next.run(request).await);
  }
  let header_token = request
    .headers()
    .get(AUTHORIZATION)
    .and_then(|v| v.to_str().ok())
    .and_then(|s| s.strip_prefix("Bearer "));

  let token =
    header_token.ok_or_else(|| create_error_response::<()>(StatusCode::UNAUTHORIZED, "未找到"))?;

  let token_data = decode::<Claims>(
    token,
    &DecodingKey::from_secret(&state.keypair.private_key),
    &Validation::default(),
  )
  .map_err(|e| create_error_response::<()>(StatusCode::UNAUTHORIZED, e.to_string()))?;

  request.extensions_mut().insert(token_data.claims.sub);

  Ok(next.run(request).await)
}

fn create_error_response<T: serde::Serialize>(
  code: StatusCode,
  message: impl Into<String>,
) -> Response {
  let biz_result = BizResult::<T>::err(Some(code.as_u16())).with_message(message);
  let error_response = (StatusCode::UNAUTHORIZED, Json(biz_result));
  error_response.into_response()
}
