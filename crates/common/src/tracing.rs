use anyhow::Context;
// use chrono::{Local, NaiveDate};
use once_cell::sync::Lazy;
// use std::fs::{File, OpenOptions};
// use std::io::Write;
use std::fs;
use std::path::Path;
use std::sync::Mutex;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{EnvFilter, fmt, layer::SubscriberExt, registry, util::SubscriberInitExt};

// 全局存储 WorkerGuard，确保在程序终止时，所有缓冲的日志都被正确地刷新到输出目标（文件和控制台）
static LOG_GUARD: Lazy<Mutex<Option<tracing_appender::non_blocking::WorkerGuard>>> =
  Lazy::new(|| Mutex::new(None));

pub fn init_tracing(config: TracingConfig) -> anyhow::Result<()> {
  // 确保日志目录存在
  if !Path::new(&config.log_path).exists() {
    fs::create_dir_all(&config.log_path).with_context(|| "无法创建日志目录")?;
  }

  // 创建按天滚动的文件日志写入器

  //   let file_appender = LocalDailyRotation::new(&config.log_path, &config.log_filename_prefix, "log");
  let file_appender = RollingFileAppender::builder()
    .rotation(Rotation::DAILY)
    .filename_prefix(&config.log_filename_prefix)
    .filename_suffix("log")
    .max_log_files(30) // 保留30天的日志文件
    .build(&config.log_path)
    .with_context(|| "无法创建日志文件写入器:")?;

  // 创建非阻塞的日志写入器和对应的守护器
  let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

  // 存储守护器，确保日志在程序结束前被刷新
  *LOG_GUARD.lock().unwrap() = Some(guard);

  // 设置日志级别过滤器，默认级别为 info
  let env_filter = EnvFilter::builder()
    .with_default_directive(tracing::Level::INFO.into())
    .from_env()
    .unwrap_or_else(|_| EnvFilter::new(config.log_level.as_str()));

  // 配置文件日志层（无 ANSI 颜色）
  let file_layer = fmt::layer()
    .with_writer(non_blocking)
    .with_timer(fmt::time::ChronoLocal::new(
      "%Y-%m-%dT%H:%M:%S%.6fZ".to_string(),
    ))
    .with_ansi(false)
    .with_thread_ids(true)
    .with_file(true)
    .with_line_number(true);

  // 配置控制台日志层（带 ANSI 颜色）
  let console_layer = fmt::layer()
    .with_timer(fmt::time::ChronoLocal::new(
      "%Y-%m-%dT%H:%M:%S%.6fZ".to_string(),
    ))
    .with_file(true)
    .with_line_number(true)
    .with_thread_ids(true);

  // 注册全局订阅器
  registry()
    .with(env_filter)
    .with(file_layer)
    .with(console_layer)
    .try_init()
    .map_err(|e| {
      // 如果全局订阅器已存在（比如被 tauri_plugin_log 占用），
      // 我们仍然可以通过直接写入文件的方式记录日志
      // 文件写入器（non_blocking）仍然有效，可以直接使用
      let content = format!("警告: Tracing 全局订阅器初始化失败: {}，可能已被其他系统占用，文件日志写入器仍然有效，日志将写入文件",
        e
      );
      anyhow::anyhow!(content)
    })?;

  Ok(())
}

pub struct TracingConfig {
  /// 日志文件路径
  pub log_path: String,
  /// 日志文件名前缀
  pub log_filename_prefix: String,
  /// 日志级别
  pub log_level: String,
}

impl TracingConfig {
  pub fn new(
    log_path: impl Into<String>,
    log_filename_prefix: impl Into<String>,
    log_level: impl Into<String>,
  ) -> Self {
    Self {
      log_path: log_path.into(),
      log_filename_prefix: log_filename_prefix.into(),
      log_level: log_level.into(),
    }
  }
}

// 自定义本地时区日志轮转器
// pub struct LocalDailyRotation {
//   directory: PathBuf,
//   file_name_prefix: String,
//   file_name_suffix: String,
//   current_date: Mutex<Option<NaiveDate>>,
//   current_file: Mutex<Option<File>>,
// }

// impl LocalDailyRotation {
//   pub fn new(
//     directory: impl AsRef<Path>,
//     file_name_prefix: impl Into<String>,
//     file_name_suffix: impl Into<String>,
//   ) -> Self {
//     Self {
//       directory: directory.as_ref().to_path_buf(),
//       file_name_prefix: file_name_prefix.into(),
//       file_name_suffix: file_name_suffix.into(),
//       current_date: Mutex::new(None),
//       current_file: Mutex::new(None),
//     }
//   }

//   fn get_current_file(&self) -> Result<File, std::io::Error> {
//     let today = Local::now().date_naive();

//     let mut current_date = self.current_date.lock().unwrap();
//     let mut current_file = self.current_file.lock().unwrap();

//     // 检查是否需要轮转
//     if current_date.as_ref() != Some(&today) || current_file.is_none() {
//       // 创建新的日志文件
//       let file_name = format!(
//         "{}-{}.{}",
//         self.file_name_prefix,
//         today.format("%Y-%m-%d"),
//         self.file_name_suffix
//       );
//       let file_path = self.directory.join(file_name);

//       let file = OpenOptions::new()
//         .create(true)
//         .append(true)
//         .open(file_path)?;

//       *current_date = Some(today);
//       *current_file = Some(file);
//     }

//     Ok(current_file.as_ref().unwrap().try_clone()?)
//   }
// }

// impl Write for LocalDailyRotation {
//   fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
//     let mut file = self.get_current_file()?;
//     file.write(buf)
//   }

//   fn flush(&mut self) -> std::io::Result<()> {
//     if let Ok(mut file) = self.get_current_file() {
//       file.flush()
//     } else {
//       Ok(())
//     }
//   }
// }
