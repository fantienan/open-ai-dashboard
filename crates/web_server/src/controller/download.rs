use crate::service::dashboard;
use crate::utils::{app::AppError, common::AppState};

use axum::{Json, body::Body, extract::State, http::header, response::IntoResponse};
use common::download::DownloadCodeOption;
use common::errors::{DashboardError, MetadataError};
use common::types::dashboard::DashboardConfig;
use sea_orm::DbConn;
use serde::Deserialize;
use std::collections::HashMap;
use std::path;
use tracing::info;
use web_server_entity::metadata_info;

pub async fn download_code(
  State(state): State<AppState>,
  Json(payload): Json<DownloadCode>,
) -> Result<impl IntoResponse, AppError> {
  let template_src_dir = payload
    .template_src_dir
    .as_deref()
    .unwrap_or(&state.config.template_src_dir);
  info!("正在下载代码...");
  info!(
    "参数 chart_id: {}, message_id: {}, template_src_dir: {}",
    payload.chat_id, payload.message_id, template_src_dir
  );
  // 获取dashboard配置
  let (dashboard_config, dashboard_json) =
    get_dashboard_config(&state.db, &payload.chat_id, &payload.message_id).await?;

  // 获取元数据选项
  let metadata_options = get_metadata_options(&state.db).await?;

  // 合并所有下载选项
  let mut download_code_options = vec![DownloadCodeOption::new(
    dashboard_json,
    "public/dashboard.json".to_string(),
  )];
  download_code_options.extend(metadata_options);

  let path = path::PathBuf::from(&template_src_dir);
  let filename = format!("{}.zip", dashboard_config.title.value);
  let file_bytes = common::download::code(
    &path,
    Some(download_code_options),
    Some(move |content: String| content.replace("{{ title }}", &dashboard_config.title.value)),
  )
  .await
  .map_err(|e| DashboardError::DownloadFailed(e.to_string()))?;

  // 使用 UTF-8 编码和 RFC 8187 格式处理文件名
  // 同时提供普通 filename 和 RFC 6266 编码的 filename* 以增强兼容性
  let content_disposition = common::response::gen_content_disposition(&filename);

  Ok((
    [(
      header::CONTENT_TYPE,
      mime::APPLICATION_OCTET_STREAM.as_ref(),
    )],
    [(header::CONTENT_DISPOSITION, content_disposition)],
    Body::from_stream(file_bytes),
  ))
}

// the input to our `create_user` handler
#[derive(Deserialize)]
pub struct DownloadCode {
  chat_id: String,
  message_id: String,
  template_src_dir: Option<String>,
}

/// 获取并处理dashboard配置
async fn get_dashboard_config(
  db: &DbConn,
  chat_id: &String,
  message_id: &String,
) -> Result<(DashboardConfig, String), AppError> {
  info!("正在查询dashboard配置...");

  let dashboard_config = dashboard::find_dashboard_config(db, chat_id, message_id)
    .await
    .map_err(|e| DashboardError::QueryError(e.to_string()))?
    .ok_or_else(|| DashboardError::NotFound)?;

  info!("查询dashboard配置成功");

  info!("正在序列化dashboard配置...");

  let dashboard_json = serde_json::to_string(&dashboard_config)
    .map_err(|e| DashboardError::SerializationError(e.to_string()))?;

  info!("dashboard序列化成功");

  Ok((dashboard_config, dashboard_json))
}

// 获取并处理元数据
async fn get_metadata_options(db: &DbConn) -> Result<Vec<DownloadCodeOption>, AppError> {
  info!("查询元数据...");

  let metadata_all = metadata_info::Model::find_all(db)
    .await
    .map_err(|e| MetadataError::QueryError(e.to_string()))?;

  info!("查询元数据成功,元数据数量: {}", metadata_all.len());

  let mut grouped_metadata = HashMap::new();

  for metadata in metadata_all {
    grouped_metadata
      .entry(metadata.table_name.to_string())
      .or_insert_with(Vec::new)
      .push(metadata.to_camel_case_map());
  }

  let mut options = Vec::with_capacity(grouped_metadata.len());

  for (table_name, metadata) in grouped_metadata {
    let metadata_json = serde_json::to_string(&metadata)
      .map_err(|e| MetadataError::SerializationError(e.to_string()))?;
    let relative_file_path = format!("public/metadata/{}.json", table_name);
    options.push(DownloadCodeOption::new(metadata_json, relative_file_path));
  }

  Ok(options)
}
