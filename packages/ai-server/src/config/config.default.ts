import './env.ts'
import path from 'node:path'
import fs from 'fs-extra'
import type { BizConfig } from './types.ts'

const {
  DEEPSEEK_BASE_URL,
  DEEPSEEK_API_KEY,
  BIZ_AI_SERVER_PORT,
  BIZ_WEB_SERVER_URL,
  BIZ_TIAN_DI_TU_API_KEY,
  BIZ_WORKSPACE,
  SQLITE_DATABASE_URL,
} = process.env

const NODE_ENV = process.env.NODE_ENV || 'local'

const workspace = path.resolve(BIZ_WORKSPACE)
const _config: BizConfig = {
  webServerBaseUrl: BIZ_WEB_SERVER_URL!,
  isProductionEnvironment: NODE_ENV === 'production',
  sqlite: {
    databaseUrl: SQLITE_DATABASE_URL!,
  },
  tianditu: {
    apiKey: BIZ_TIAN_DI_TU_API_KEY!,
  },
  service: {
    host: '0.0.0.0',
    port: +BIZ_AI_SERVER_PORT!,
    address: '',
  },
  pino: {
    dir: path.join(workspace, 'logs', 'ai-server', NODE_ENV!),

    extension: '.log',
    dateFormat: 'yyyy-MM-dd',
    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
    frequency: 'daily',
    filePrefix: 'ai-server',
  },
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  },
  llm: {
    deepseek: {
      apiKey: DEEPSEEK_API_KEY!,
      BASE_URL: DEEPSEEK_BASE_URL!,
    },
  },
  routes: {
    root: '/api/v1/ai-server',
    llm: {
      prefix: '/llm',
      chat: '/chat',
      vote: '/vote',
      message: '/message',
      dashboard: '/dashboard',
    },
  },
  whitelistRoutes: ['/ping'],
}

fs.ensureFileSync(_config.sqlite.databaseUrl)
fs.ensureDirSync
export const config = _config
