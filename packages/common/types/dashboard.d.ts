export type DashboardRecord = {
  data: DashboardSchema
  createdAt: string
  userId: string
  chatId: string
  messageId: string
}

export type DashboardChartSchema = {
  data: Record<string, any>[]
  chartType: 'bar' | 'line' | 'pie' | 'list' | 'table' | 'indicator-card'
  title: {
    description: string
    value: string
    prefix?: string | undefined
    suffix?: string | undefined
  }
  tableName: string
  footer?:
    | {
        description: string
        value: string
        prefix?: string | undefined
        suffix?: string | undefined
      }
    | undefined
  whoCalled?: string | undefined
  id?: string | undefined
  progress?:
    | {
        description: string
        total: number
        current: number
      }
    | undefined
}

export type DashboardSchema = {
  title: {
    description: string
    value: string
    prefix?: string | undefined
    suffix?: string | undefined
  }
  charts: DashboardChartSchema[]
}

export type MetadataInfo = {
  columnName: string
  columnAliases: string
  columnType: string
  isNullable: boolean
  columnDefault: string | null
  tableName: string
  tableAliases: string
}
// 图表类型枚举
export type AnalyzeResultChartType = 'bar' | 'line' | 'pie' | 'list' | 'table' | 'indicator-card'

// 基础数据项类型
export interface SchemaItem {
  value: string
  prefix?: string
  suffix?: string
  description: string
}

// 进度类型
export interface CreateDashboardProgress {
  total: number
  current: number
  description: string
}

// 分析结果类型
export interface AnalyzeResultSchema {
  chartType: AnalyzeResultChartType
  title: SchemaItem
  data: Record<string, any>[]
  footer?: SchemaItem
  tableName: string
  whoCalled?: string
  id?: string
  progress?: CreateDashboardProgress
}
