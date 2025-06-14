use crate::utils::{app::AppState, config::Config, services};
use common::response::BizResult;
use serde_json::json;
use std::path;
use tauri::Manager;
// use crate::utils::node_server;
mod map_server;
mod shapefile_server;
mod utils;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  common::env::init_env();
  println!("src-tauri: 初始化配置...");
  let config: Config = Config::form_env();

  tauri::Builder::default()
    .manage(AppState::new(config.clone()))
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(utils::log::init(config.clone()))
    .setup(move |app| {
      log::info!("src-tauri: 初始化配置成功: {:?}", config);
      let app_handle = app.handle();

      utils::window::init_window_config(&app_handle)?;
      log::info!("初始化工作目录...");
      let workspace_info = common::files::init_workspace()?;
      log::info!("初始化工作目录成功: {:?}", workspace_info);

      let app_handle_clone = app_handle.clone();
      tauri::async_runtime::spawn(async move {
        let node_server_disabled = std::env::var("NODE_SEVER_DISABLED").is_ok();
        if node_server_disabled {
          let _ = tokio::spawn(services::start_web_server());
        } else {
          services::start_services(app_handle_clone).await;
        }
      });
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      disk_read_dir,
      shapefile_to_record,
      create_server,
      shapefile_to_geojson,
    ])
    .build(tauri::generate_context!())
    .expect("运行应用程序时出错")
    .run(|app_handle, event| match event {
      tauri::RunEvent::Exit => {
        log::info!("应用正在退出，开始清理资源");
        if let Some(state) = app_handle.try_state::<AppState>() {
          log::info!("应用正在退出，清理 Node Server 资源");
          if let Ok(rt) = tokio::runtime::Runtime::new() {
            log::info!("创建 Tokio 运行时成功");
            rt.block_on(async {
              log::info!("-----正在停止 Node Server...");
              log::info!("{:?}", state.node_server.lock().await.is_some());
              if let Some(child) = state.node_server.lock().await.take() {
                log::info!("正在停止 Node Server...");
                match child.kill() {
                  Ok(_) => log::info!("Node Server 已停止"),
                  Err(e) => log::error!("停止 Node Server 时出错: {}", e),
                }
              }
            })
          } else {
            log::warn!("无法创建 Tokio 运行时");
          }
        }

        log::info!("退出应用");
      }
      tauri::RunEvent::WindowEvent { event, .. } => match event {
        tauri::WindowEvent::CloseRequested { .. } => {
          log::info!("窗口关闭请求，开始清理资源");
        }
        _ => {}
      },
      _ => {}
    });
}

#[tauri::command]
fn disk_read_dir(path: Option<&str>) -> Result<serde_json::Value, String> {
  utils::disk::disk_read_dir(path)
}

#[tauri::command]
async fn shapefile_to_geojson(shapefile_path: &str) -> Result<serde_json::Value, String> {
  shapefile_server::utilities::shapefile_to_geojson(shapefile_path).await
}

#[tauri::command]
async fn shapefile_to_record(shapefile_path: &str) -> Result<serde_json::Value, String> {
  shapefile_server::utilities::shapefile_to_record(shapefile_path)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn create_server(
  app_handle: tauri::AppHandle,
  input_path: &str,
) -> Result<serde_json::Value, String> {
  let input_path = path::Path::new(input_path);
  if !input_path.exists() {
    return Err("文件不存在".to_string());
  }
  let file_name = input_path
    .file_stem()
    .and_then(|name| name.to_str())
    .ok_or_else(|| "无法获取文件名".to_string())?;

  let mbtiles_path = common::files::get_mbtiles_path();

  let output_path = mbtiles_path.join(format!("{}.mbtiles", file_name));

  if let Err(e) = map_server::command::create_server(input_path, &output_path).await {
    return Ok(json!(BizResult::<()>::err(None,).with_message(e)));
  }

  if let Err(e) = map_server::command::start_server(&app_handle) {
    return Ok(json!(BizResult::<()>::err(None,).with_message(e)));
  }

  Ok(json!(BizResult::<()>::ok(None)))
}
