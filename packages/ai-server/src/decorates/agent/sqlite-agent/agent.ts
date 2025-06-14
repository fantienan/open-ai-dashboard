import {
  CreateDashboardProgressSchema,
  DashboardSchema,
  GenerateDashboardsBasedOnDataAnalysisResultsSchema,
} from '@ai-dashboard/common/utils'
import { CoreAssistantMessage, CoreToolMessage, StepResult, StreamTextOnStepFinishCallback } from 'ai'
import { ChatContextInstance } from '../context.ts'
import { llmProvider } from '../utils/ai.ts'
import { SQLiteAgentTool, createSqliteTools } from './tools.ts'

export type SQLiteAgentInstance = InstanceType<typeof SQLiteAgent>

export type SQLiteAgentToolResults = StepResult<SQLiteAgentTool>['toolResults']

export type SQLiteAgentProps = {
  chatContext: ChatContextInstance
}

export class SQLiteAgent {
  chatContext: ChatContextInstance<SQLiteAgentTool>
  model = llmProvider.languageModel('chat-model-reasoning')
  constructor(props: SQLiteAgentProps) {
    this.chatContext = props.chatContext
  }

  createTools() {
    return createSqliteTools(this.chatContext)
  }

  async createDashboard({
    toolResults,
    messages,
    dashboardGenerationCompleted,
  }: {
    toolResults: SQLiteAgentToolResults
    messages: ((CoreAssistantMessage | CoreToolMessage) & { id: string })[]
    dashboardGenerationCompleted: GenerateDashboardsBasedOnDataAnalysisResultsSchema
  }) {
    try {
      const dashboardSchema: DashboardSchema = {
        title: {
          value: dashboardGenerationCompleted.title,
          description: dashboardGenerationCompleted.description,
        },
        charts: [],
      }
      let internalToolResults = toolResults
      if (internalToolResults.length === 1) {
        internalToolResults = (messages.filter((v) => v.role === 'tool').at(-2)?.content as any) ?? []
      }

      dashboardSchema.charts = internalToolResults.reduce(
        (prev, curr) => {
          if (curr.toolName === 'sqliteAnalyze' && curr.result) prev.push(curr.result as any)
          return prev
        },
        [] as DashboardSchema['charts'],
      )
      return dashboardSchema
    } catch (e) {}
  }

  async onStepFinish({
    stepType,
    finishReason,
    toolResults,
    response,
  }: Parameters<StreamTextOnStepFinishCallback<SQLiteAgentTool>>[0]) {
    if (
      this.chatContext.isCreateDashboard &&
      stepType === 'tool-result' &&
      finishReason === 'tool-calls' &&
      toolResults.length
    ) {
      const dashboardGenerationCompleted = toolResults.find(
        (v) => v.toolName === 'generateDashboardsBasedOnDataAnalysisResults' && (v.result as any).state === 'end',
      )
      const progress = (toolResults.at(-1)?.result as any).progress as CreateDashboardProgressSchema
      if (progress && progress.current === progress.total) this.chatContext.setToolResults(toolResults)
      if (dashboardGenerationCompleted) {
        this.chatContext.dashboardSchema = await this.createDashboard({
          toolResults,
          messages: response.messages,
          dashboardGenerationCompleted: dashboardGenerationCompleted.result as any,
        })
      }
    }
  }
}
