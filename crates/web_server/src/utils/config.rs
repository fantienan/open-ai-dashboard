use std::{
  env,
  path::{self, PathBuf},
};

use common::{
  env::get_app_env,
  files::{WORKSPACE_PATH, get_log_path},
};

#[derive(Debug, Clone)]
pub struct Config {
  pub db_url: String,
  pub port: u16,
  pub max_connections: u32,
  pub min_connections: u32,
  pub connect_timeout_secs: u64,
  pub idle_timeout_secs: u64,
  pub max_lifetime_secs: u64,
  pub sqlx_logging: bool,
  pub template_src_dir: String,
  pub email_smtp_host: String,
  pub email_smtp_port: u16,
  pub email_smtp_username: String,
  pub email_smtp_password: String,
  pub email_code_validity: i64,
  pub email_code_interval: i64,
  pub server_root_path: String,
  pub app_env: String,
  //   pub workspace: PathBuf,
  pub log_path: PathBuf,
  //   pub app_env: String,
  pub log_filename_prefix: String,
  pub log_level: String,
}

impl Default for Config {
  fn default() -> Self {
    let workspace = WORKSPACE_PATH.to_path_buf();
    let app_env = get_app_env();
    let log_path = get_log_path().join(format!("web-server/{}", app_env));
    let log_level = if app_env == "production" {
      "info".to_string()
    } else {
      "debug".to_string()
    };

    Self {
      db_url: format!("sqlite:///{}/db/database.db", workspace.to_string_lossy()),
      port: 3001,
      max_connections: 10,
      min_connections: 1,
      connect_timeout_secs: 8,
      idle_timeout_secs: 300,
      max_lifetime_secs: 1800,
      sqlx_logging: false,
      template_src_dir: String::new(),
      email_smtp_port: 465,
      //   email_smtp_host: "smtp.163.com".to_string(),
      //   email_smtp_username: "aidashboard@163.com".to_string(),
      //   email_smtp_password: "GJf4P5THYpCAw9dn".to_string(),
      email_smtp_host: "smtp.qq.com".to_string(),
      email_smtp_username: "363982607@qq.com".to_string(),
      email_smtp_password: "kwkmzakbiqzjbijc".to_string(),
      // 单位秒
      email_code_validity: 600,
      // 单位秒
      email_code_interval: 60,
      server_root_path: "/api/v1/web-server".to_string(),
      app_env,
      // 工作目录
      //   workspace,
      log_path,
      log_filename_prefix: "".to_string(),
      //   app_env,
      log_level,
    }
  }
}

impl Config {
  pub fn from_env() -> Self {
    let default_config = Self::default();
    Self {
      template_src_dir: env::var("TEMPLATE_SRC_DIR").unwrap_or_else(|_| {
        path::PathBuf::from(file!())
          .parent()
          .and_then(|p| p.parent())
          .and_then(|p| p.parent())
          .expect("获取当前文件路径失败")
          .join("templates/react/project")
          .display()
          .to_string()
      }),

      db_url: env::var("SQLITE_DATABASE_URL")
        .map(|v: String| format!("sqlite:///{}", v))
        .unwrap_or_else(|_| default_config.db_url),
      port: env::var("BIZ_WEB_SERVER_PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or_else(|| default_config.port),
      max_connections: env::var("DB_MAX_CONNECTIONS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or_else(|| default_config.max_connections),
      min_connections: env::var("DB_MIN_CONNECTIONS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or_else(|| default_config.min_connections),
      connect_timeout_secs: env::var("DB_CONNECT_TIMEOUT_SECS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or_else(|| default_config.connect_timeout_secs),
      idle_timeout_secs: env::var("DB_IDLE_TIMEOUT_SECS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or_else(|| default_config.idle_timeout_secs),
      max_lifetime_secs: env::var("DB_MAX_LIFETIME_SECS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or_else(|| default_config.max_lifetime_secs),
      sqlx_logging: env::var("DB_SQLX_LOGGING")
        .ok()
        .map(|v| v == "true")
        .unwrap_or_else(|| default_config.sqlx_logging),
      email_smtp_host: env::var("EMAIL_SMTP_HOST")
        .unwrap_or_else(|_| default_config.email_smtp_host),
      email_smtp_port: env::var("EMAIL_SMTP_PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or_else(|| default_config.email_smtp_port),
      email_smtp_password: env::var("EMAIL_SMTP_PASSWORD")
        .unwrap_or_else(|_| default_config.email_smtp_password),
      email_smtp_username: env::var("EMAIL_SMTP_USERNAME")
        .unwrap_or_else(|_| default_config.email_smtp_username),
      email_code_validity: env::var("EMAIL_CODE_VALIDITY_PERIOD")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or_else(|| default_config.email_code_validity),
      email_code_interval: env::var("EMAIL_CODE_INTERVAL")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or_else(|| default_config.email_code_interval),
      ..Default::default()
    }
  }
}

pub enum Routes {
  Root,
  Login,
  Register,
  UserFind,
  EmailSendCode,
  DownloadCode,
  Auth,
  MetadataFindByTableName,
}

impl Routes {
  pub fn as_str(&self) -> &'static str {
    match self {
      Routes::Root => "/",
      Routes::Login => "/login",
      Routes::Register => "/register",
      Routes::UserFind => "/user/find",
      Routes::EmailSendCode => "/email/send_code",
      Routes::DownloadCode => "/download/code",
      Routes::Auth => "/auth/certification",
      Routes::MetadataFindByTableName => "/metadata/find_by_table_name",
    }
  }
}
