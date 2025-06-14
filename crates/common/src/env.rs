use dotenv_flow::dotenv_flow;
use std::path::PathBuf;

/// 加载环境变量
pub fn dotenv() {
  dotenv_flow().ok();
}

pub fn set_default_env() {
  // 设置默认环境变量
  unsafe {
    if std::env::var(EnvVarName::BizWorkspace.as_str()).is_err() {
      let default_workspace = get_default_workspace_path();
      println!(
        "未设置工作空间环境变量，使用默认路径: {:?}",
        default_workspace
      );
      std::env::set_var(EnvVarName::BizWorkspace.as_str(), default_workspace);
    }

    if std::env::var(EnvVarName::BizAppEnv.as_str()).is_err() {
      let app_env = if cfg!(debug_assertions) {
        "development"
      } else {
        "production"
      };

      println!("未设置应用环境变量，使用默认值: {}", app_env);
      std::env::set_var(EnvVarName::BizAppEnv.as_str(), app_env);
    }
  }
}
pub fn init_env() {
  println!("初始化环境变量...");
  dotenv();
  set_default_env();
  println!("初始化环境变量完成");
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EnvVarName {
  BizAppEnv,

  // API配置
  DeepseekApiKey,
  DeepseekBaseUrl,

  // 工作空间
  BizWorkspace,

  // PostgreSQL数据库
  PostgresHost,
  PostgresPort,
  PostgresUser,
  PostgresPassword,

  // SQLite数据库
  SqliteDatabaseUrl,

  // Node服务器
  BizAiServerPort,
  BizAiServerUrl,
  BizTianDiTuApiKey,

  // 客户端
  BizMapboxAccessToken,

  // Rust服务器
  BizWebServerPort,
  BizWebServerUrl,

  // SeaORM
  SeaRomMigrationPath,
  SeaRomEntityPath,

  // 数据库URL
  DatabaseUrl,

  // 邮件SMTP
  EmailSmtpPassword,
}

impl EnvVarName {
  /// 获取环境变量的字符串名称
  pub fn as_str(&self) -> &'static str {
    match self {
      Self::DeepseekApiKey => "DEEPSEEK_API_KEY",
      Self::DeepseekBaseUrl => "DEEPSEEK_BASE_URL",
      Self::BizWorkspace => "BIZ_WORKSPACE",
      Self::PostgresHost => "POSTGRES_HOST",
      Self::PostgresPort => "POSTGRES_PORT",
      Self::PostgresUser => "POSTGRES_USER",
      Self::PostgresPassword => "POSTGRES_PASSWORD",
      Self::SqliteDatabaseUrl => "SQLITE_DATABASE_URL",
      Self::BizAiServerPort => "BIZ_AI_SERVER_PORT",
      Self::BizAiServerUrl => "BIZ_AI_SERVER_URL",
      Self::BizTianDiTuApiKey => "BIZ_TIAN_DI_TU_API_KEY",
      Self::BizMapboxAccessToken => "BIZ_MAPBOX_ACCESS_TOKEN",
      Self::BizWebServerPort => "BIZ_WEB_SERVER_PORT",
      Self::BizWebServerUrl => "BIZ_WEB_SERVER_URL",
      Self::SeaRomMigrationPath => "SEA_ROM_MIGRATION_PATH",
      Self::SeaRomEntityPath => "SEA_ROM_ENTITY_PATH",
      Self::DatabaseUrl => "DATABASE_URL",
      Self::EmailSmtpPassword => "EMAIL_SMTP_PASSWORD",
      Self::BizAppEnv => "BIZ_APP_ENV",
    }
  }
}

impl std::fmt::Display for EnvVarName {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{}", self.as_str())
  }
}

impl From<EnvVarName> for String {
  fn from(env_var: EnvVarName) -> Self {
    env_var.as_str().to_string()
  }
}

pub fn get_default_workspace_path() -> PathBuf {
  std::env::current_dir()
    .unwrap_or_else(|_| PathBuf::from("."))
    .join(".ai-dashboard")
}

pub fn get_app_env() -> String {
  std::env::var(EnvVarName::BizAppEnv.as_str()).unwrap_or_else(|_| "development".to_string())
}
