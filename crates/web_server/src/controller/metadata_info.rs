use axum::{Json, extract::State, response::IntoResponse};
use common::{errors::MetadataError, response::BizResult};
use serde::Deserialize;
use validator::Validate;
use web_server_entity::metadata_info::Model;

use crate::utils::{
  app::AppError,
  common::{AppState, ValidatedJson},
};

pub async fn find_by_table_name(
  State(state): State<AppState>,
  ValidatedJson(payload): ValidatedJson<FindByTableNamePayload>,
) -> Result<impl IntoResponse, AppError> {
  let model = Model::find_by_table_name(&state.db, &payload.table_name)
    .await
    .map_err(|e| MetadataError::QueryError(format!("查询表名失败: {}", e)))?;

  Ok(Json(BizResult::ok(Some(Model::batch_to_camel_case_maps(
    &model,
  )))))
}

#[derive(Deserialize, Debug, Validate)]
pub struct FindByTableNamePayload {
  #[validate(length(min = 1, message = "table_name不能为空"))]
  pub table_name: String,
}
