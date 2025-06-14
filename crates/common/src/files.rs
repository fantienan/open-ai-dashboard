use super::env::{EnvVarName, get_default_workspace_path};
use anyhow::Result;
use once_cell::sync::Lazy;
use path_absolutize::Absolutize;
use std::{fs, path::PathBuf};

fn get_workspace_path() -> PathBuf {
  let workspace_env = EnvVarName::BizWorkspace.as_str();
  let workspace = std::env::var(workspace_env)
    .map(PathBuf::from)
    .unwrap_or_else(|e| {
      eprintln!("未设置 {} {}，使用默认路径", workspace_env, e);
      get_default_workspace_path()
    });
  workspace
    .clone()
    .absolutize()
    .unwrap_or_else(|e| {
      eprintln!(
        "转换绝对路径失败: {}，使用原始路径: {}",
        e,
        workspace.to_string_lossy()
      );
      workspace.into()
    })
    .into_owned()
}

pub static WORKSPACE_PATH: Lazy<PathBuf> = Lazy::new(|| get_workspace_path());

pub fn get_vector_path() -> PathBuf {
  WORKSPACE_PATH.join("vector")
}

pub fn get_mbtiles_path() -> PathBuf {
  WORKSPACE_PATH.join("vecotr/mbtiles")
}

pub fn get_log_path() -> PathBuf {
  WORKSPACE_PATH.join("logs")
}

pub fn get_db_path() -> PathBuf {
  WORKSPACE_PATH.join("db")
}

pub fn create_workspace() -> Result<WorkspaceInfo> {
  let vector_path = get_vector_path();

  let mbtiles_path = vector_path.join("mbtiles");
  if !mbtiles_path.exists() {
    fs::create_dir_all(&mbtiles_path)?
  }

  // 创建config.yaml 文件 并写入内容
  let config_path = vector_path.join("config.yaml");
  if !config_path.exists() {
    let content = format!(
      r#"
      mbtiles:
        paths: mbtiles
    "#
    );
    fs::write(config_path, content)?;
  }

  let log_path = get_log_path();
  if !log_path.exists() {
    fs::create_dir(&log_path)?;
  }

  let db_path = get_db_path();
  if !db_path.exists() {
    fs::create_dir_all(&db_path)?;
  }

  let db_file = db_path.join("database.db");
  if !db_file.exists() {
    fs::File::create(db_file)?;
  }

  Ok(WorkspaceInfo {
    workspace_path: WORKSPACE_PATH.clone(),
    vector_path: vector_path.clone(),
    mbtiles_path: mbtiles_path.clone(),
    log_path: log_path.clone(),
    db_path: db_path.clone(),
  })
}

pub fn init_workspace() -> Result<WorkspaceInfo> {
  create_workspace()
}

#[derive(Debug, Clone)]
pub struct WorkspaceInfo {
  pub workspace_path: PathBuf,
  pub vector_path: PathBuf,
  pub mbtiles_path: PathBuf,
  pub log_path: PathBuf,
  pub db_path: PathBuf,
}
