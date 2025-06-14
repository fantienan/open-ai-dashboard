use super::config::Config;
use anyhow::{Context, Result};
use tauri_plugin_shell::{
  ShellExt,
  process::{CommandChild, CommandEvent},
};

pub async fn start(app_handle: tauri::AppHandle) -> Result<CommandChild> {
  let server_name = Config::default().ai_server_binarie;
  let sidecar_command = app_handle
    .shell()
    .sidecar(&server_name)
    .with_context(|| format!("获取 {} 命令失败", server_name))?;

  let (mut rx, child) = sidecar_command
    .spawn()
    .with_context(|| format!("启动 {} 进程失败", server_name))?;

  wait_for_server_startup(&mut rx).await?;

  // 启动事件处理（非阻塞）
  tauri::async_runtime::spawn(async move {
    handle_server_events(rx).await;
  });
  Ok(child)
}

async fn wait_for_server_startup(
  rx: &mut tauri::async_runtime::Receiver<CommandEvent>,
) -> Result<()> {
  // 异步任务设置300秒的执行时间，防止无限等待
  let timeout_duration = std::time::Duration::from_secs(30000);
  tokio::time::timeout(timeout_duration, async {
    while let Some(event) = rx.recv().await {
      match event {
        CommandEvent::Stdout(data) => {
          let output = String::from_utf8_lossy(&data);
          log_filtered_output(&output, |line| log::info!("{}", line));
          if output.contains("---Service started successfully---") {
            return Ok(());
          }
        }
        CommandEvent::Stderr(data) => {
          let output = String::from_utf8_lossy(&data);
          log_filtered_output(&output, |line| log::warn!("{}", line));
        }
        CommandEvent::Error(error) => {
          return Err(anyhow::anyhow!("Node Server 启动错误: {}", error));
        }
        CommandEvent::Terminated(payload) => {
          return Err(anyhow::anyhow!(
            "Node Server 意外终止，退出代码: {:?}",
            payload.code
          ));
        }
        _ => {}
      }
    }
    Err(anyhow::anyhow!("等待服务器启动时连接中断"))
  })
  .await
  .map_err(|_| anyhow::anyhow!("服务器启动超时"))??;

  Ok(())
}

async fn handle_server_events(mut rx: tauri::async_runtime::Receiver<CommandEvent>) {
  while let Some(event) = rx.recv().await {
    match event {
      CommandEvent::Stdout(data) => {
        let output = String::from_utf8_lossy(&data);
        log_filtered_output(&output, |line| log::info!("{}", line));
      }
      CommandEvent::Stderr(data) => {
        let output = String::from_utf8_lossy(&data);
        log_filtered_output(&output, |line| log::warn!("{}", line));
      }
      CommandEvent::Error(data) => {
        log_filtered_output(&data, |line| log::error!("{}", line));
      }
      CommandEvent::Terminated(payload) => {
        log::info!("{:?}", payload.code);
        break;
      }
      _ => {}
    }
  }
}

fn log_filtered_output(data: &str, log_fn: fn(&str)) {
  for line in data.lines() {
    if !line.trim().is_empty() {
      log_fn(line);
    }
  }
}
