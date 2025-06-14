use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// 图表类型
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ChartType {
  Bar,
  Line,
  Pie,
  List,
  Table,
  #[serde(rename = "indicator-card")]
  IndicatorCard,
}

/// 通用配置项模式
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SchemaItem {
  pub value: String,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub prefix: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub suffix: Option<String>,
  pub description: String,
}

/// 分析任务进度
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DashboardProgress {
  /// 分析任务总数
  pub total: u32,
  /// 当前分析任务进度
  pub current: u32,
  /// 分析任务的描述
  pub description: String,
}

/// 分析结果
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct AnalyzeResult {
  /// 图表类型
  #[serde(rename = "chartType")]
  pub chart_type: ChartType,
  /// 图表标题
  pub title: SchemaItem,
  /// 图表数据(数组)
  pub data: Vec<HashMap<String, serde_json::Value>>,
  /// 图表底部说明
  #[serde(skip_serializing_if = "Option::is_none")]
  pub footer: Option<SchemaItem>,
  /// 表名
  #[serde(rename = "tableName")]
  pub table_name: String,
  /// 被谁调用
  #[serde(skip_serializing_if = "Option::is_none", rename = "whoCalled")]
  pub who_called: Option<String>,
  /// 被其它工具调用时传入的id
  #[serde(skip_serializing_if = "Option::is_none")]
  pub id: Option<String>,
  /// 分析任务进度
  #[serde(skip_serializing_if = "Option::is_none")]
  pub progress: Option<DashboardProgress>,
}

/// 标题配置
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct TitleConfig {
  /// 标题
  pub value: String,
  /// 描述
  pub description: String,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DashboardConfig {
  /// 标题配置
  pub title: TitleConfig,
  /// 图表配置
  pub charts: Vec<AnalyzeResult>,
}
