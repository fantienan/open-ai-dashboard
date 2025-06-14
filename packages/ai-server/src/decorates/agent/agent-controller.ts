import { ChatContextInstance } from './context.ts'
import { SQLiteAgent } from './sqlite-agent/index.ts'
import * as utils from './utils/index.ts'

export type AgentControllerInstance = InstanceType<typeof AgentController>

export class AgentController {
  chatContext: any
  utils: typeof utils
  constructor() {
    this.utils = utils
  }

  getAgentByUserNeeds(chatContext: ChatContextInstance) {
    if (chatContext.isAnalyze || chatContext.isCreateDashboard) {
      return new SQLiteAgent({ chatContext })
    }
    return new SQLiteAgent({ chatContext })
  }
}
