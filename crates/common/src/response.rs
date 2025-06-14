use percent_encoding::{AsciiSet, CONTROLS, percent_encode};
use serde::Serialize;

/// 仅对 HTTP Content-Disposition 中需要转义的字符进行编码
const DISPOSITION_ENCODE_SET: &AsciiSet = &CONTROLS
  .add(b' ')
  .add(b'"')
  .add(b'%')
  .add(b';')
  .add(b'\\')
  .add(b'/')
  .add(b'?');

pub fn gen_content_disposition(filename: &str) -> String {
  // 使用 UTF-8 编码和 RFC 8187 格式处理文件名
  // 同时提供普通 filename 和 RFC 6266 编码的 filename* 以增强兼容性
  format!(
    "attachment; filename=\"{}\"; filename*=UTF-8''{}",
    filename,
    percent_encode(filename.as_bytes(), DISPOSITION_ENCODE_SET)
  )
}

// pub fn create_result

#[derive(Serialize)]
pub struct BizResult<T = ()>
where
  T: Serialize,
{
  pub code: u16,
  pub message: String,
  pub data: Option<T>,
  pub success: bool,
}

impl<T: Serialize> Default for BizResult<T> {
  fn default() -> Self {
    BizResult {
      code: Self::OK,
      message: "成功".to_string(),
      data: None,
      success: true,
    }
  }
}

impl<T: Serialize> BizResult<T> {
  /// 10000 成功
  pub const OK: u16 = 1000;
  /// 40000-49999 平台异常
  pub const SYS_ERROR: u16 = 4000;

  /// 50000 未知异常
  pub const UN_ERROR: u16 = 5000;

  /// 60000-69999 基本的业务异常
  pub const BIZ_ERROR: u16 = 6000;

  /// 70000 参数校验异常
  pub const VALIDATE_ERROR: u16 = 7000;

  pub fn ok(data: Option<T>) -> Self {
    BizResult {
      data,
      ..Default::default()
    }
  }

  pub fn err(code: Option<u16>) -> Self {
    BizResult {
      code: code.unwrap_or(Self::BIZ_ERROR),
      message: "失败".to_string(),
      data: None,
      success: false,
    }
  }

  pub fn with_code(mut self, code: u16) -> Self {
    self.code = code;
    self
  }

  pub fn with_message(mut self, message: impl Into<String>) -> Self {
    self.message = message.into();
    self
  }

  pub fn to_string(self) -> Result<String, serde_json::Error> {
    serde_json::to_string(&self)
  }
}
