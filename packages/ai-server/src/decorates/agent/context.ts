import type { DashboardSchema } from '@ai-dashboard/common/utils'
import type { DataStreamWriter, StepResult, ToolSet } from 'ai'
import { v4 as uuidv4 } from 'uuid'
import { AnalyzeUserNeedsSchema, generateDescriptionInformation, getDatabase } from './utils/index.ts'

export type ChatContextInstance<TOOLS extends ToolSet = ToolSet> = InstanceType<typeof ChatContext<TOOLS>>

export type AgentToolResults<TOOLS extends ToolSet = ToolSet> = StepResult<TOOLS>['toolResults']

export type ChatContextProps = AnalyzeUserNeedsSchema & {
  dataStream: DataStreamWriter
}
export class ChatContext<TOOLS extends ToolSet = ToolSet> {
  dashboardSchema?: DashboardSchema
  dataStream: DataStreamWriter
  isCreateDashboard?: boolean
  isAnalyze?: boolean
  getDatabase = getDatabase
  toolResults?: AgentToolResults<TOOLS>
  constructor(props: ChatContextProps) {
    this.dataStream = props.dataStream
    this.isCreateDashboard = props.isCreateDashboard
    this.isAnalyze = props.isAnalyze
  }
  genUUID() {
    return uuidv4()
  }

  setToolResults(toolResults: AgentToolResults<TOOLS>) {
    this.toolResults = toolResults
  }

  generateDescriptionInformation(data: any) {
    return generateDescriptionInformation({ data })
  }

  filterTables(result: { name: string }[]) {
    return result.filter((v) => v.name.startsWith('analyze_'))
  }
}
