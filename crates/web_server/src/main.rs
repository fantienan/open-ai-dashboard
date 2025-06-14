use web_server::WebServerOptions;

#[tokio::main]
async fn main() {
  web_server::start(WebServerOptions::new(true, false))
    .await
    .unwrap_or_else(|e| {
      log::error!("Web服务启动失败: {}", e);
      std::process::exit(1);
    });
}
