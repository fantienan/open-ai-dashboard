use ring::{
  rand::SystemRandom,
  signature::{Ed25519KeyPair, KeyPair},
};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum RsaError {
  #[error("密钥对生成失败: {0}")]
  KeyPairGenerationError(String),
  #[error("密钥对解析失败: {0}")]
  KeyPairParseError(String),
}

// 实现从 ring 错误类型到自定义错误类型的转换
impl From<ring::error::Unspecified> for RsaError {
  fn from(e: ring::error::Unspecified) -> Self {
    RsaError::KeyPairGenerationError(format!("{:?}", e))
  }
}

impl From<ring::error::KeyRejected> for RsaError {
  fn from(e: ring::error::KeyRejected) -> Self {
    RsaError::KeyPairParseError(format!("{:?}", e))
  }
}

// 定义自己的密钥对结构体
#[derive(Debug, Clone)]
pub struct KeyPairData {
  pub private_key: Vec<u8>,
  pub public_key: Vec<u8>,
}

pub fn generate_keypair() -> Result<KeyPairData, RsaError> {
  // 生成 Ed25519 密钥对
  let rng = SystemRandom::new();
  let pkcs8_bytes = Ed25519KeyPair::generate_pkcs8(&rng)?;
  let key_pair = Ed25519KeyPair::from_pkcs8(pkcs8_bytes.as_ref())?;
  let private_key = pkcs8_bytes.as_ref().to_vec();
  let public_key = key_pair.public_key().as_ref().to_vec();

  Ok(KeyPairData {
    private_key,
    public_key,
  })
}
