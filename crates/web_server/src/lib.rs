use common::{env, files::init_workspace, rsa::generate_keypair, tracing::TracingConfig};
use sea_orm::{ConnectOptions, Database};
use std::time::Duration;
use tracing::{error, info, warn};
use web_server_migration::{Migrator, MigratorTrait};
mod controller;
mod service;
mod utils;

pub async fn start(start_options: WebServerOptions) -> anyhow::Result<()> {
  env::init_env();
  info!("初始化工作目录...");
  let workspace_info =
    init_workspace().map_err(|e| anyhow::anyhow!("工作目录初始化失败: {}", e))?;
  info!("初始化工作目录成功");

  info!("初始化服务配置...");
  let config = utils::config::Config::from_env();
  info!("初始化服务配置成功");

  if !start_options.is_log {
    info!("初始化日志记录器...");
    if let Err(e) = common::tracing::init_tracing(TracingConfig::new(
      config.log_path.to_string_lossy(),
      config.log_filename_prefix.clone(),
      config.log_level.clone(),
    )) {
      warn!("初始化日志记录器失败: {}", e);
    } else {
      info!("初始化日志记录器成功");
    }
  } else {
    info!("初始化 log 桥接层...");
    // if let Err(e) = is_log::LogTracer::init() {
    //   warn!("初始化日志记录器失败: {}", e);
    // } else {
    //   info!("初始化日志记录器成功");
    // }
  }

  info!("服务配置: {:?}", config);
  info!("运行环境: {}", config.app_env);
  info!("数据库地址: {}", config.db_url);
  info!("工作目录信息: {:?}", workspace_info);

  info!("初始化数据库链接...");
  let mut options = ConnectOptions::new(&config.db_url);
  options
    .max_connections(config.max_connections)
    .min_connections(config.min_connections)
    .connect_timeout(Duration::from_secs(config.connect_timeout_secs))
    .idle_timeout(Duration::from_secs(config.idle_timeout_secs))
    .max_lifetime(Duration::from_secs(config.max_lifetime_secs))
    .sqlx_logging(config.sqlx_logging);

  let db = Database::connect(options)
    .await
    .map_err(|e| anyhow::anyhow!("数据库连接失败:{}", e))?;
  db.ping()
    .await
    .map_err(|e| anyhow::anyhow!("数据库 ping 连接失败:{}", e))?;
  info!("数据库连接成功");

  info!("数据库迁移...");
  Migrator::up(&db, None)
    .await
    .map_err(|e| anyhow::anyhow!("数据库迁移失败:{}", e))?;
  info!("数据库迁移成功");

  info!("密钥对生成...");
  let keypair = generate_keypair().map_err(|e| anyhow::anyhow!("生成密钥对失败:{}", e))?;
  info!("密钥对生成成功");

  info!("启动服务...");
  let app = utils::app::create_app(utils::common::AppState {
    db,
    config: config.clone(),
    keypair,
  });

  let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", config.port))
    .await
    .map_err(|e| anyhow::anyhow!("服务启动失败:{}", e))?;

  info!("服务启动成功");

  let network_interfaces = local_ip_address::list_afinet_netifas()
    .map_err(|e| anyhow::anyhow!("获取网络接口信息失败:{}", e))?;

  // 获取并显示所有网络接口的IP地址
  for (_, ip) in network_interfaces.iter() {
    if ip.is_ipv4() {
      info!("服务地址: http://{:?}:{}", ip, config.port);
    }
  }
  if !start_options.is_sync {
    // 在单独的任务中运行服务器，这样函数可以立即返回
    tokio::spawn(async move {
      if let Err(e) = axum::serve(listener, app).await {
        error!("服务运行错误: {}", e);
      }
    });
  } else if let Err(e) = axum::serve(listener, app).await {
    error!("服务运行错误: {}", e);
  }

  Ok(())
}

#[derive(Debug, Clone)]
pub struct WebServerOptions {
  /// 是否同步运行服务
  pub is_sync: bool,
  /// 是否初始化日志记录器
  pub is_log: bool,
}

impl WebServerOptions {
  pub fn new(is_sync: bool, is_log: bool) -> Self {
    Self { is_sync, is_log }
  }
}
