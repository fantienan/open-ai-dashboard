import type { Attachment, UIMessage } from 'ai'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

export function convertToUIMessages(
  messages: {
    id: string
    parts: any[]
    role: string
    createdAt: string
    attachments: any[]
  }[],
): UIMessage[] {
  return messages.map((message) => ({
    id: message.id,
    parts: message.parts as UIMessage['parts'],
    role: message.role as UIMessage['role'],
    content: '',
    createdAt: new Date(message.createdAt),
    experimental_attachments: (message.attachments as Attachment[]) ?? [],
  }))
}

const genSchemaItem = (name: string) => {
  return z.object(
    {
      value: z.string({ description: name }),
      prefix: z.string({ description: `${name}前缀` }).optional(),
      suffix: z.string({ description: `${name}后缀` }).optional(),
      description: z.string({ description: `${name}描述` }),
    },
    { description: `${name}配置` },
  )
}

export const genBasiceDataZodSchema = (name: string) => genSchemaItem(name)
export type BasicDataSchema = z.infer<ReturnType<typeof genBasiceDataZodSchema>>

const analyzeResultWithChartTypeZodSchema = z.enum(['bar', 'line', 'pie', 'list', 'table', 'indicator-card'], {
  description: '图表类型',
})

export const createDashboardProgressZodSchema = z
  .object({
    total: z.number().describe('分析任务总数'),
    current: z.number().describe('当前分析任务进度'),
    description: z.string().describe('分析任务的描述').max(10),
  })
  .describe('分析任务进度')

export type CreateDashboardProgressSchema = z.infer<typeof createDashboardProgressZodSchema>

const analyzeResultZodSchema = z.object({
  chartType: analyzeResultWithChartTypeZodSchema,
  title: genSchemaItem('图表标题'),
  data: z.array(z.record(z.string(), z.any()), { description: '图表数据(数组)' }),
  footer: genSchemaItem('图表底部说明').optional(),
  tableName: z.string({ description: '表名' }),
  whoCalled: z.string().describe('被谁调用').optional(),
  id: z.string().uuid().describe('被其它工具调用时传入的id').optional(),
  progress: createDashboardProgressZodSchema.optional(),
})

export const analyzeResultSchema = { zod: analyzeResultZodSchema, json: () => zodToJsonSchema(analyzeResultZodSchema) }

export type AnalyzeResultSchema = z.infer<typeof analyzeResultZodSchema>

const dashboardZodSchema = z.object({
  title: genSchemaItem('Dashboard 标题'),
  charts: z.array(analyzeResultZodSchema, { description: '图表配置' }),
})

export const dashboardSchema = { zod: dashboardZodSchema, json: () => zodToJsonSchema(dashboardZodSchema) }

export type DashboardSchema = z.infer<typeof dashboardZodSchema>

const generateDashboardsBasedOnDataAnalysisResultsZodSchema = z.object({
  state: z.enum(['start', 'end']).describe('Dashboard生成工具的状态'),
  id: z
    .string()
    .uuid()
    .describe('不需要自动生成，将该工具返回结果中的id作为下次调用时的参数，作为Dashboard的id')
    .optional(),
  title: z.string().max(10).describe('Dashboard标题'),
  description: z.string().max(30).describe('Dashboard描述'),
  progress: createDashboardProgressZodSchema,
})

export type GenerateDashboardsBasedOnDataAnalysisResultsSchema = z.infer<
  typeof generateDashboardsBasedOnDataAnalysisResultsZodSchema
>

export const generateDashboardsBasedOnDataAnalysisResultsSchema = {
  zod: generateDashboardsBasedOnDataAnalysisResultsZodSchema,
  json: () => zodToJsonSchema(generateDashboardsBasedOnDataAnalysisResultsZodSchema),
}
