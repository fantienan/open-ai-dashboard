import { dashboardSchema } from '@ai-dashboard/common/utils'
import multer from 'fastify-multer'
import type { BizConfig } from './config/index.ts'
import { type User } from './database/schema.ts'
import { AgentControllerInstance, Result, errors, sqliteDb } from './decorates/index.ts'
import * as schemas from './schemas/index.ts'

declare module 'fastify' {
  interface FastifyInstance {
    bizAppConfig: BizConfig
    BizResult: typeof Result
    bizError: typeof errors
    bizAgentController: AgentControllerInstance
    bizDb: typeof sqliteDb
    bizSchemas: typeof schemas
    bizDashboardSchema: typeof dashboardSchema
    bizAuthenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
  interface FastifyRequest {
    session: {
      user: User
    }
  }
}
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      POSTGRES_HOST: string
      POSTGRES_PORT: number
      POSTGRES_USER: string
      POSTGRES_PASSWORD: string
      SQLITE_DATABASE_URL: string
      BIZ_AI_SERVER_PORT: number
      BIZ_AI_SERVER_URL: string
      BIZ_WEB_SERVER_URL: string
      BIZ_TIAN_DI_TU_API_KEY: string
      DEEPSEEK_URL?: string
      DEEPSEEK_API_KEY?: string
      BIZ_WORKSPACE: string
      BIZ_ABSOLUTE_PATH?: string
    }
  }
}
