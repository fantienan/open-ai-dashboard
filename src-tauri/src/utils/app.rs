use crate::utils::config::Config;
use std::sync::Arc;
use tauri_plugin_shell::process::CommandChild;
use tokio::sync::Mutex;

#[derive(Default)]
pub struct AppState {
  pub node_server: Arc<Mutex<Option<CommandChild>>>,
  pub config: Config,
}

impl AppState {
  pub fn new(config: Config) -> Self {
    Self {
      node_server: Arc::new(Mutex::new(None)),
      config,
    }
  }
}
