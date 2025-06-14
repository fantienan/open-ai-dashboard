use crate::utils::config::Config;
use nu_ansi_term::Color;
use tauri_plugin_log::{Target, TargetKind};

// 初始化日志
pub fn init(config: Config) -> impl tauri::plugin::Plugin<tauri::Wry> {
  log::info!("初始化日志...");

  let logger = tauri_plugin_log::Builder::new()
    .level(config.log_level)
    .timezone_strategy(config.log_timezone_strategy)
    .format(move |out, message, record| {
      let local_time = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S%.6fZ");
      if config.app_env == "production" {
        out.finish(format_args!(
          "{} {} {:?} {}:{} {}",
          local_time,
          record.level(),
          std::thread::current().id(),
          record.file().unwrap_or("unknown"),
          record.line().unwrap_or(0),
          message
        ))
      } else {
        out.finish(format_args!(
          "{} {} {:?} {}:{} {}",
          Color::DarkGray.paint(local_time.to_string()),
          get_level_color(record.level()).paint(record.level().to_string()),
          std::thread::current().id(),
          Color::DarkGray.paint(record.file().unwrap_or("unknown")),
          Color::DarkGray.paint(format!("{}", record.line().unwrap_or(0))),
          message
        ))
      }
    })
    .targets([
      Target::new(TargetKind::Stdout),
      Target::new(TargetKind::Folder {
        path: config.log_dir,
        file_name: Some(config.log_file_name),
      }),
      Target::new(TargetKind::Webview),
    ])
    .build();
  log::info!("初始化日志成功");
  logger
}

// 获取日志级别对应的颜色
fn get_level_color(level: log::Level) -> Color {
  match level {
    log::Level::Trace => Color::DarkGray, // 灰色，对应 tracing 的 trace
    log::Level::Debug => Color::Blue,     // 蓝色，对应 tracing 的 debug
    log::Level::Info => Color::Green,     // 绿色，对应 tracing 的 info
    log::Level::Warn => Color::Yellow,    // 黄色，对应 tracing 的 warn
    log::Level::Error => Color::Red,      // 红色，对应 tracing 的 error
  }
}
