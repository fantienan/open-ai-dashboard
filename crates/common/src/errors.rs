use axum::extract::rejection::JsonRejection;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ValidationError {
  #[error("验证错误: {0}")]
  General(#[from] validator::ValidationErrors),

  #[error("JSON解析错误: {0}")]
  Json(#[from] JsonRejection),
}

#[derive(Debug, Error)]
pub enum UserError {
  #[error("登录失败: {0}")]
  LoginFailed(String),

  #[error("发送邮件失败: {0}")]
  EmailSendFailed(String),

  #[error("用户注册失败: {0}")]
  RegisterFailed(String),

  #[error("查询用户失败: {0}")]
  QueryFailed(String),
}

#[derive(Debug, Error)]
pub enum MetadataError {
  #[error("元数据JSON序列化错误: {0}")]
  SerializationError(String),

  #[error("查询元数据错误: {0}")]
  QueryError(String),
}

#[derive(Debug, Error)]
pub enum DatabaseError {
  #[error("数据库错误: {0}")]
  General(#[from] sea_orm::DbErr),
}

#[derive(Debug, Error)]
pub enum DashboardError {
  #[error("下载代码失败: {0}")]
  DownloadFailed(String),

  #[error("查询仪表盘错误: {0}")]
  QueryError(String),

  #[error("未找到仪表盘")]
  NotFound,

  #[error("仪表盘解析错误: {0}")]
  ParseError(String),

  #[error("仪表盘JSON序列化错误: {0}")]
  SerializationError(String),
}
