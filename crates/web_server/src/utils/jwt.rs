use jsonwebtoken::{EncodingKey, Header, encode};
use serde::{Deserialize, Serialize};

/// JWT Claims 结构体，包含用户标识、过期时间和签发者信息。
#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
  /// 用户标识（如用户ID）
  pub sub: String,
  /// 过期时间（UNIX 时间戳）
  pub exp: i64,
  /// 签发者（可选）
  pub iss: Option<String>,
}

impl Claims {
  /// 创建一个新的 Claims 实例，默认过期时间为当前时间加一天。
  fn new<S: Into<String>>(sub: S) -> Self {
    Self {
      sub: sub.into(),
      exp: (chrono::Utc::now() + chrono::Duration::days(1)).timestamp(),
      iss: Some("ai_dashboard_web_server".to_string()),
    }
  }
}

/// 生成 JWT Token
pub fn generate_token<S: Into<String>>(
  sub: S,
  secret: &[u8],
) -> Result<String, jsonwebtoken::errors::Error> {
  encode(
    &Header::default(),
    &Claims::new(sub),
    &EncodingKey::from_secret(secret),
  )
}
