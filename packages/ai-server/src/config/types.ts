import type { FastifyCorsOptions, FastifyCorsOptionsDelegate } from '@fastify/cors'

export type BizConfig = {
  webServerBaseUrl: string
  isProductionEnvironment: boolean
  service: {
    port: number
    host: string
    address: string
  }
  pino: {
    dir: string
    frequency: string
    extension: string
    filePrefix: string
    dateFormat: string
    translateTime: string
  }
  cors: NonNullable<FastifyCorsOptions> | FastifyCorsOptionsDelegate

  llm: {
    deepseek: {
      apiKey: string
      BASE_URL: string
    }
  }
  sqlite: {
    databaseUrl: string
  }
  tianditu: {
    apiKey: string
  }
  routes: {
    root: string
    llm: {
      prefix: string
      chat: string
      vote: string
      message: string
      dashboard: string
    }
  }
  whitelistRoutes: string[]
}
