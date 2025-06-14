import path from 'node:path'
import { configDotenv } from 'dotenv'
import { expand } from 'dotenv-expand'
import findConfig from 'find-config'

const NODE_ENV = process.env.NODE_ENV || 'local'

let envPath = findConfig('.env', { dot: true })

const genDefaultEnv = () => {
  const BIZ_WORKSPACE = path.join(process.cwd(), '.ai-dashboard')
  const BIZ_AI_SERVER_PORT = '3000'
  const BIZ_WEB_SERVER_PORT = '3001'
  const BIZ_WEB_SERVER_URL = `http://localhost:${BIZ_WEB_SERVER_PORT}/api/v1/web-server`

  const defaultEnvVars = {
    BIZ_AI_SERVER_PORT,
    BIZ_WORKSPACE,
    BIZ_WEB_SERVER_PORT,
    BIZ_WEB_SERVER_URL,
    BIZ_TIAN_DI_TU_API_KEY: '88721cfef6a58dc383e288e7f46f69d0',
    SQLITE_DATABASE_URL: `${BIZ_WORKSPACE}\\db\\database.db`,
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: '5432',
    POSTGRES_USER: 'postgres',
    POSTGRES_PASSWORD: 'postgres',
  }

  Object.entries(defaultEnvVars).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value
    }
  })
}

genDefaultEnv()
if (!envPath) {
  console.warn('未找到 .env 文件，使用默认环境变量配置')
} else {
  envPath = path.dirname(envPath)
  expand(
    configDotenv({
      path: [path.join(envPath, '.env'), path.join(envPath, `.env.${NODE_ENV}`), path.join(envPath, '.env.local')],
      override: true,
    }),
  )
}
