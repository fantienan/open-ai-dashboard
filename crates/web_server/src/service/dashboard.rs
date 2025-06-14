use crate::utils::app::AppError;
use common::{errors::DashboardError, types::dashboard::DashboardConfig};
use sea_orm::*;
use web_server_entity::dashboard;

pub async fn find_dashboard_config(
  db: &DbConn,
  chat_id: &String,
  message_id: &String,
) -> Result<Option<DashboardConfig>, AppError> {
  let dashboard_config = dashboard::Model::find_by_primary_key(&db, &chat_id, &message_id)
    .await
    .map_err(|e| DashboardError::QueryError(e.to_string()))?
    .ok_or_else(|| DashboardError::NotFound)?
    .parse_data()
    .map(Some)
    .map_err(|e| DashboardError::ParseError(e.to_string()))?;
  Ok(dashboard_config)
}
