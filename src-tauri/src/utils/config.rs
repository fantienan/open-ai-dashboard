use std::path::PathBuf;

use common::env::get_app_env;
use tauri_plugin_log::TimezoneStrategy;

#[derive(Debug, Clone)]
pub struct Config {
  pub app_env: String,
  pub ai_server_binarie: String,
  pub martin_binarie: String,
  pub log_dir: PathBuf,
  pub log_timezone_strategy: TimezoneStrategy,
  pub log_file_name: String,
  pub log_level: log::LevelFilter,
}

impl Default for Config {
  fn default() -> Self {
    let app_env = get_app_env();

    Self {
      app_env: app_env.clone(),
      ai_server_binarie: "ai-server".to_string(),
      martin_binarie: "martin".to_string(),
      log_dir: common::files::get_log_path().join("app").join(&app_env),
      log_timezone_strategy: TimezoneStrategy::UseLocal,
      log_file_name: format!("{}", chrono::Local::now().format("%Y-%m-%d").to_string()),
      log_level: match app_env.as_str() {
        "production" => log::LevelFilter::Info,
        _ => log::LevelFilter::Debug,
      },
    }
  }
}

impl Config {
  pub fn form_env() -> Self {
    let default_config = Config::default();
    Self { ..default_config }
  }
}
