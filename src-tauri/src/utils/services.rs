use crate::AppState;
use crate::utils::node_server;
use tauri::Manager;
use web_server::WebServerOptions;

pub async fn start_web_server() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
  log::info!("正在启动 Web Server...");
  web_server::start(WebServerOptions::new(false, true)).await?;
  log::info!("Web Server 启动成功");
  Ok(())
}

pub async fn start_node_server(
  app_handle: tauri::AppHandle,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
  log::info!("正在启动 Node Server...");
  let state = app_handle.state::<AppState>();
  let child = node_server::start(app_handle.clone()).await?;
  log::info!("Node Server 启动成功");
  *state.node_server.lock().await = Some(child);
  Ok(())
}

pub async fn start_services(app_handle: tauri::AppHandle) {
  let web_server_task = tokio::spawn(start_web_server());
  let node_server_task = tokio::spawn(start_node_server(app_handle.clone()));

  let (web_result, node_result) = tokio::join!(web_server_task, node_server_task);

  match web_result {
    Ok(Ok(())) => log::info!("Web Server 启动成功"),
    Ok(Err(e)) => log::error!("Web Server 启动失败: {}", e),
    Err(e) => log::error!("Web Server 启动过程中发生错误: {}", e),
  }

  match node_result {
    Ok(Ok(())) => log::info!("Node Server 启动成功"),
    Ok(Err(e)) => log::error!("Node Server 启动失败: {}", e),
    Err(e) => log::error!("Node Server 启动过程中发生错误: {}", e),
  }
  log::info!("服务启动流程完成");
}
