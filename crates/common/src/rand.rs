use rand::{Rng, distr::Alphanumeric};

/// 生成指定长度的数字验证码
pub fn generate_numeric_code(length: usize) -> String {
  let mut rng = rand::rng();
  (0..length)
    .map(|_| rng.random_range(0..10).to_string())
    .collect()
}

/// 生成指定长度的字母数字混合验证码
pub fn generate_alphanumeric_code(length: usize) -> String {
  rand::rng()
    .sample_iter(&Alphanumeric)
    .take(length)
    .map(char::from)
    .collect()
}
