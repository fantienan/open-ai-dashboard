use crate::utils::{
  app::AppError,
  common::{AppState, ValidatedJson},
  template::gen_email_template,
};
use axum::{extract::State, response::IntoResponse};
use chrono::Utc;
use common::{
  chrono::string_to_date_time, errors::UserError, rand::generate_numeric_code, response::BizResult,
};
use lettre::message::MultiPart;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
use serde::Deserialize;
use tracing::info;
use validator::Validate;
use web_server_entity::email_code::Model;

pub async fn send_email_code(
  state: State<AppState>,
  ValidatedJson(payload): ValidatedJson<SendEmailCodeOptions>,
) -> Result<impl IntoResponse, AppError> {
  let email_model = Model::find_by_email(&state.db, &payload.email)
    .await
    .map_err(|e| UserError::LoginFailed(e.to_string()))?;

  if let Some(email_model) = email_model {
    info!("email_model: {:?}", email_model);
    // 防刷机制
    let created_at = string_to_date_time(&email_model.created_at)
      .map_err(|e| UserError::LoginFailed(format!("无效的日期格式: {}", e)))?;

    let elapsed = Utc::now().signed_duration_since(created_at).num_seconds();

    if elapsed < state.config.email_code_interval {
      return Err(UserError::EmailSendFailed("操作频繁稍后再试".to_string()).into());
    }

    Model::delete_expired_codes(&state.db, state.config.email_code_validity.clone())
      .await
      .map_err(|e| UserError::EmailSendFailed(e.to_string()))?;
  }

  // 生成6位数字验证码
  let verification_code = generate_numeric_code(6);

  // 构建邮件内容，包含验证码
  let html_body = gen_email_template(&verification_code);

  let plain_body = format!(
    r#"Ai Dashboard 登录验证码
您好，我们收到了使用以下验证码的登录尝试：
{}
请将此验证码复制到 Ai Dashboard 登录页面完成登录。
此链接将在10分钟内失效，且仅限使用一次。如果您未尝试登录但收到了此邮件，请忽略此邮件。
此邮件由系统自动发送，请勿直接回复。"#,
    verification_code
  );

  info!(
    "SMTP服务参数 email_smtp_host: {}, email_smtp_port: {}, email_smtp_username: {}, email_smtp_password: {}",
    state.config.email_smtp_host,
    state.config.email_smtp_port,
    state.config.email_smtp_username,
    state.config.email_smtp_password,
  );

  // 1. 构建邮件内容
  let email = Message::builder()
    .from(
      state
        .config
        .email_smtp_username
        .parse::<lettre::message::Mailbox>()
        .map_err(|e| UserError::EmailSendFailed(e.to_string()))?,
    )
    .to(
      payload
        .email
        .parse::<lettre::message::Mailbox>()
        .map_err(|e| UserError::EmailSendFailed(e.to_string()))?,
    )
    .multipart(MultiPart::alternative_plain_html(plain_body, html_body))
    .map_err(|e| UserError::EmailSendFailed(e.to_string()))?;

  // 2. 配置 SMTP 客户端
  let creds = Credentials::new(
    state.config.email_smtp_username.to_string(),
    state.config.email_smtp_password.to_string(),
  );

  // 根据端口号选择合适的安全连接方式
  let mailer = if state.config.email_smtp_port == 465 {
    info!("使用implicit TLS (SMTPS) 连接");
    // 465端口使用implicit TLS (SMTPS)
    SmtpTransport::relay(&state.config.email_smtp_host)
      .map_err(|e| UserError::EmailSendFailed(e.to_string()))?
      .port(465)
      .credentials(creds)
      .build()
  } else if state.config.email_smtp_port == 587 {
    info!("使用STARTTLS连接");
    // 587端口使用STARTTLS
    SmtpTransport::starttls_relay(&state.config.email_smtp_host)
      .map_err(|e| UserError::EmailSendFailed(e.to_string()))?
      .port(587)
      .credentials(creds)
      .build()
  } else {
    info!("使用不安全连接");
    // 其他端口，尝试不安全连接（仅用于测试）
    SmtpTransport::builder_dangerous(&state.config.email_smtp_host)
      .port(state.config.email_smtp_port)
      .credentials(creds)
      .build()
  };

  // 3. 发送邮件
  mailer
    .send(&email)
    .map_err(|e| UserError::EmailSendFailed(e.to_string()))?;

  info!("验证码邮件发送成功");

  // 4. 将验证码存储到数据库或缓存中，设置过期时间
  Model::insert(&state.db, payload.email.clone(), verification_code.clone())
    .await
    .map_err(|e| UserError::EmailSendFailed(e.to_string()))?;

  Ok(axum::Json(
    BizResult::<()>::ok(None).with_message("验证码已发送"),
  ))
}

#[derive(Deserialize, Debug, Validate)]
pub struct SendEmailCodeOptions {
  #[validate(email(message = "无效的邮箱格式"))]
  email: String,
}
