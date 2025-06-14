use crate::utils::app::AppError;
use askama::Template;
use askama_web::WebTemplate;
use axum::response::{Html, IntoResponse};
use common::types::dashboard::{DashboardConfig, TitleConfig};

// #[derive(Template)] 会在编译期生成渲染代码，模板路径相对于项目根目录
#[derive(Template, WebTemplate)]
#[template(path = "root.html")]
struct DashboardTemplate {
  dashboard: DashboardConfig,
}

// basic handler that responds with a static string
pub async fn main() -> Result<impl IntoResponse, AppError> {
  let template = DashboardTemplate {
    dashboard: DashboardConfig {
      title: TitleConfig {
        value: "Dashboard".to_string(),
        description: "This is a dashboard".to_string(),
      },
      charts: vec![],
    },
  };
  Ok(Html(template.render()?))
}
