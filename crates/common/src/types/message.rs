use serde::{Deserialize, Serialize};
use serde_json::Value;

/// 顶层枚举，根据 "type" 字段反序列化为不同变体
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "kebab-case")]
pub enum MessagePart {
  /// 对应 {"type":"step-start"}
  StepStart,

  /// 对应 {"type":"tool-invocation", "toolInvocation": { ... }}
  #[serde(rename_all = "camelCase")]
  ToolInvocation {
    #[serde(rename = "toolInvocation")]
    data: ToolInvocationData,
  },

  /// 对应 {"type":"text", "text": "..."}
  Text { text: String },
}

/// tool-invocation 的详细内容
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ToolInvocationData {
  pub state: String,
  pub step: u32,
  pub args: InvocationArgs,
  #[serde(rename = "toolCallId")]
  pub tool_call_id: String,
  #[serde(rename = "toolName")]
  pub tool_name: String,
  pub result: InvocationResult,
}

/// 通用的 args，字段都可选
#[derive(Debug, Serialize, Deserialize)]
pub struct InvocationArgs(pub Value);

/// tool-invocation 中 result 字段，多种可能，用 untagged enum
#[derive(Debug, Serialize, Deserialize)]
pub struct InvocationResult(pub Value);

/// 表名的结构（SELECT name FROM sqlite_master）
#[derive(Debug, Serialize, Deserialize)]
pub struct TableInfo {
  pub name: String,
}

/// PRAGMA table_info(...) 的单列信息
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColumnInfo {
  pub cid: u32,
  pub name: String,
  #[serde(rename = "type")]
  pub column_type: String,
  pub notnull: u8,
  pub dflt_value: Option<String>,
  pub pk: u8,
}

/// sqliteAnalyze 返回的结构
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisResult {
  pub data: Vec<NameValue>,
  pub title: String,
  pub description: String,
  pub summary: String,
  pub chart_renderer_type: String,
  pub chart_type: String,
}

/// 分析结果中每条数据项
#[derive(Debug, Serialize, Deserialize)]
pub struct NameValue {
  pub name: String,
  pub value: f64,
}
