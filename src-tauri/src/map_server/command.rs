use std::{path::Path, process::Command};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

pub fn get_ogr2ogr_version() -> Result<String, String> {
  match Command::new("ogr2ogr").arg("--version").output() {
    Ok(output) => String::from_utf8(output.stdout)
      .map_err(|e| format!("无法解析版本信息: {}", e))
      .map(|s| s.trim().to_string()),
    Err(e) => Err(format!("执行 ogr2ogr --version 失败: {}", e)),
  }
}

pub fn command_to_string(cmd: &Command) -> String {
  let program = cmd.get_program().to_string_lossy();
  let args: Vec<String> = cmd
    .get_args()
    .map(|arg| arg.to_string_lossy().into_owned())
    .collect();

  format!("{} {}", program, args.join(" "))
}

#[derive(Debug)]
pub struct CommandOgr2ogrParams {
  input_path: String,
  output_path: String,
  format_name: String,
  min_zoom: Option<u8>,
  max_zoom: Option<u8>,
  epsg: Option<String>,
}

pub fn command_ogr2ogr(params: CommandOgr2ogrParams) -> Command {
  println!("params: {:?}", params);
  let mut cmd = Command::new("ogr2ogr");
  let CommandOgr2ogrParams {
    input_path,
    output_path,
    format_name,
    min_zoom,
    max_zoom,
    epsg,
  } = params;
  let min_zoom = min_zoom.unwrap_or(1);
  let max_zoom = max_zoom.unwrap_or(22);
  let epsg = epsg.unwrap_or("EPSG:3857".to_string());

  cmd
    .arg("-f")
    .arg(format_name)
    .arg(output_path)
    .arg(input_path)
    .arg("-dsco")
    .arg(format!("MINZOOM={}", min_zoom))
    .arg("-dsco")
    .arg(format!("MAXZOOM={}", max_zoom))
    .arg("-t_srs")
    .arg(epsg);
  cmd
}

pub async fn create_server<P, Q>(input_path: P, output_path: Q) -> Result<(), String>
where
  P: AsRef<Path>,
  Q: AsRef<Path>,
{
  let input_path = input_path
    .as_ref()
    .to_str()
    .ok_or_else(|| "无法转换 input_path".to_string())?
    .to_string();
  let output_path = output_path
    .as_ref()
    .to_str()
    .ok_or_else(|| "无法转换 output_path".to_string())?
    .to_string();
  let mut cmd = command_ogr2ogr(CommandOgr2ogrParams {
    input_path,
    output_path,
    format_name: "MBTiles".to_string(),
    min_zoom: Some(1),
    max_zoom: Some(18),
    epsg: None,
  });

  println!("{:?}", get_ogr2ogr_version());

  let mut child = cmd.spawn().map_err(|e| format!("执行命令失败: {}", e))?;

  println!("执行命令: {}", command_to_string(&cmd));

  // 等待子进程执行完毕
  let status = child
    .wait()
    .map_err(|e| format!("等待进程完成时发生错误: {}", e))?;

  if !status.success() {
    return Err(format!("命令执行失败，退出码: {:?}", status.code()));
  }

  println!("命令执行完成，退出码: {:?}", status.code());
  Ok(())
}

pub fn start_server(app_handle: &tauri::AppHandle) -> Result<(), String> {
  let shell = app_handle.shell();
  let cmd = shell.sidecar("martin").map_err(|e| e.to_string())?;
  let workspace_path = common::files::get_vector_path();
  println!(
    "{}",
    format!(
      "--config {}",
      workspace_path.join("config.yaml").to_str().unwrap()
    )
  );
  let (mut rx, _) = cmd
    .arg(format!(
      "--config {}",
      workspace_path.join("config.yaml").to_str().unwrap()
    ))
    .spawn()
    .map_err(|e| e.to_string())?;

  // let mut app_handle_clone = app_handle.clone();

  // 监听 node 进程的输出日志
  tauri::async_runtime::spawn(async move {
    while let Some(event) = rx.recv().await {
      match event {
        CommandEvent::Stdout(line) => match String::from_utf8(line) {
          Ok(line_str) => log::info!("map server stdout: {:?}", line_str),
          Err(e) => log::error!("map server stdout: {:?}", e),
        },
        CommandEvent::Stderr(line) => match String::from_utf8(line) {
          Ok(line_str) => log::info!("map server stderr: {:?}", line_str),
          Err(e) => log::error!("map server stderr: {:?}", e),
        },
        _ => {}
      }
    }
  });

  Ok(())
}
