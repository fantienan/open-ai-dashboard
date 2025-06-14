use axum::{
  Json,
  extract::{FromRequest, Request, rejection::JsonRejection},
};
use common::rsa::KeyPairData;
use serde::de::DeserializeOwned;
use validator::Validate;

use super::{app::AppError, config::Config};

#[derive(Clone)]
pub struct AppState {
  pub db: sea_orm::DatabaseConnection,
  pub config: Config,
  /// (私钥，公钥)
  pub keypair: KeyPairData,
}

#[derive(Debug, Clone, Copy, Default)]
pub struct ValidatedJson<T>(pub T);

impl<T, S> FromRequest<S> for ValidatedJson<T>
where
  T: DeserializeOwned + Validate,
  S: Send + Sync,
  Json<T>: FromRequest<S, Rejection = JsonRejection>,
{
  type Rejection = AppError;

  async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
    let Json(value) = Json::<T>::from_request(req, state).await?;
    value.validate()?;
    Ok(ValidatedJson(value))
  }
}
