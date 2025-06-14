import {
  AnalyzeResultSchema,
  analyzeResultSchema,
  generateDashboardsBasedOnDataAnalysisResultsSchema,
} from '@ai-dashboard/common/utils'
import { tool } from 'ai'
import { z } from 'zod'
import { logger } from '../../../utils/index.ts'
import { createBizError } from '../../errors.ts'
import { Result } from '../../result.ts'
import type { ChatContextInstance } from '../context.ts'

export type SQLiteAgentTool = ReturnType<typeof createSqliteTools>

const genParametersSchema = (context: ChatContextInstance) => {
  const schema = z.object({ sql: z.string().describe('要执行的 SQL 查询') })
  if (context.isCreateDashboard) return analyzeResultSchema.zod.pick({ whoCalled: true, id: true }).merge(schema)
  return schema
}

export const createSqliteSchemaTool = (context: ChatContextInstance) =>
  tool({
    description: ` 获取SQLite数据库中的表`,
    parameters: genParametersSchema(context),
    execute: async ({ sql }) => {
      try {
        logger.info(`获取SQLite数据库表执行sql:`)
        const db = context.getDatabase()
        const result = context.filterTables(db.prepare(sql).all() as any) as any
        db.close()
        logger.info(`获取SQLite数据库表成功：${JSON.stringify(result)}`)
        return result
      } catch (error) {
        if (error instanceof Error) return createBizError(Result.AI_AGENT_TOOL_ERROR, error)
        throw error
      }
    },
  })

export const createSqliteTableFieldTool = (context: ChatContextInstance) =>
  tool({
    description: '获取SQLite数据库表字段信息',
    parameters: genParametersSchema(context),
    execute: async ({ sql }) => {
      try {
        logger.info(`获取SQLite数据库表字段信息执行sql:`)
        const db = context.getDatabase()
        const result = db.prepare(sql).all()
        db.close()
        logger.info(`获取SQLite数据库表字段信息成功`)
        return result
      } catch (error) {
        if (error instanceof Error) return createBizError(Result.AI_AGENT_TOOL_ERROR, error)
        throw error
      }
    },
  })

export const createUpdateMetadataInfo = (context: ChatContextInstance) =>
  tool({
    description: `
    SQLite数据库元数据工具，该工具的作用是记录数据库中素有表的字段信息，要求如下：
        - 你要先查询数据库中所有表的字段信息，其中包括元数据表和其它表，其它表又称为目标表
        - 元数据表名称为metadata_info，它已经存在无需创建
        - 元数据表结构如下：
            - column_name: 字段名称，用于存储目标表的字段名称
            - column_aliases: 字段别名，用于存储目标表的字段别名
            - column_type: 字段类型，用于存储目标表的字段类型
            - table_name: 表名称，用于存储目标表的名称
            - table_aliases: 表别名，用于存储目标表别名
            - is_nullable: 字段是否可为空，用于存储目标表字段是否可为空，可为空存1，非空存0
        - 元数据表非空字段生成默认值
    `,
    parameters: z.object({
      sql: z.string().describe('sql语句'),
    }),
    execute: async ({ sql }) => {
      try {
        logger.info(`SQLite数据库创建元数据表工具:`)
        const db = context.getDatabase()
        db.prepare(sql).run()
        db.close()
        logger.info(`SQLite数据库元数据表生成工具执行成功`)
        return { sql }
      } catch (error) {
        if (error instanceof Error) return createBizError(Result.AI_AGENT_TOOL_ERROR, error)
        throw error
      }
    },
  })

const genAnalyzeToolParametersSchema = (context: ChatContextInstance) => {
  const schema = z.object({
    sql: z.string().describe('要执行的SQL语句'),
    title: z.string({ description: '分析任务的标题' }).max(10),
    description: z.string({ description: '分析任务的描述' }).max(20),
    summary: z.string({ description: '分析任务的总结性文字' }).max(30),
    longText: z.string({ description: '分析任务的长文本' }).max(100),
  })

  if (context.isCreateDashboard) {
    return analyzeResultSchema.zod
      .pick({ chartType: true, tableName: true, whoCalled: true, id: true, progress: true })
      .required()
      .merge(schema)
  }

  return analyzeResultSchema.zod.pick({ chartType: true, tableName: true }).merge(schema)
}

export const createSqliteAnalyzeTool = (context: ChatContextInstance) =>
  tool({
    description: `
    SQLite数据库数据分析工具，需要满足以下要求：
        - 不要限制查询数据的条数
        - 为分析任务生成标题和描述，要求准确、简洁、明了，标题在4-10个汉字之间，描述在10-30个汉字之间
        - 为分析任务生成描述，要求准确、简洁、明了，不要超过20个汉字
        - 为分析任务生成总结性文字, 要求准确、简洁、明了，不要超过30个汉字
        - 为分析任务生成长文本, 要求准确、简洁、明了，不要超过100个汉字
    `,
    parameters: genAnalyzeToolParametersSchema(context),
    execute: async ({ sql, title, description, summary, longText, ...parameters }) => {
      try {
        logger.info(`SQLite数据库数据分析工具执行sql:`)
        const db = context.getDatabase()
        const data = db.prepare(sql).all() as Record<string, any>[]
        db.close()
        logger.info(`SQLite数据库数据分析工具执行成功`)
        const result: AnalyzeResultSchema = {
          ...parameters,
          data,
          title: { value: title, description },
          footer: { value: summary, description: longText },
        }
        if (result.progress) {
          result.progress = { ...result.progress, description }
        }
        return result
      } catch (error) {
        if (error instanceof Error) return createBizError(Result.AI_AGENT_TOOL_ERROR, error)
        throw error
      }
    },
  })

export const createGenerateDashboardsBasedOnDataAnalysisResultsTool = (context: ChatContextInstance) =>
  tool({
    description: `
    Dashboard生成工具，调用此工具需要满足以下条件：
        - 用户明确指出要生成Dashboard
        - 在开始生成Dashboard和生成结束时必须调用此工具并且必须传入分析任务进度信息
        - 将所有SQLite数据库数据分析工具返回的title和footer
        - 调用SQLite数据库数据分析工具进行分析，至少给出8种分析方案， 分析结果以图表展示，图表类型如下：
            - 4个指标卡，图表类型为indicator-card
            - 1个折线图，图表类型为line
            - 1个柱状图，图表类型为bar
            - 1个列表，图表类型为list，为了数据丰富要多查一些字段
            - 1个表格，图表类型为table，为了数据丰富要多查一些字段
    `,
    parameters: generateDashboardsBasedOnDataAnalysisResultsSchema.zod.merge(
      z.object({
        value: z.string({ description: '标题' }),
        description: z.string({ description: `描述` }),
      }),
    ),
    execute: async (parameters) => {
      if (parameters.state === 'start') {
        logger.info(`开始生成Dashboard`)
      } else if (parameters.state === 'end') {
        if (context.toolResults) {
          const data = context.toolResults
            .reduce((prev, curr: any) => {
              const v = curr.result as AnalyzeResultSchema
              prev.push(`- ${v.title.value}`)
              if (v.footer) prev.push(`- ${v.footer.value}`)
              return prev
            }, [] as string[])
            .join('\n')
          const res = await context.generateDescriptionInformation(data)
          if (res) {
            parameters.title = res.title
            parameters.description = res.description
          }
        }
        logger.info(`Dashboard生成完成`)
      }
      return {
        ...parameters,
        id: parameters.id ?? context.genUUID(),
        whoCalled: 'generateDashboardsBasedOnDataAnalysisResults',
      }
    },
  })

export const createSqliteTools = (context: ChatContextInstance) => ({
  sqliteSchema: createSqliteSchemaTool(context),
  sqliteTableField: createSqliteTableFieldTool(context),
  sqliteAnalyze: createSqliteAnalyzeTool(context),
  generateDashboardsBasedOnDataAnalysisResults: createGenerateDashboardsBasedOnDataAnalysisResultsTool(context),
  updateMetadataInfo: createUpdateMetadataInfo(context),
})
