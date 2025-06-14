import { drizzle } from 'drizzle-orm/better-sqlite3'
import { config } from '../config/index.ts'
import { logger } from '../utils/logger.ts'
import { createSqlite } from '../utils/sqlite.ts'

logger.info('正在初始化 SQLite 数据库...')

const sqlite = createSqlite()

if (sqlite.open) {
  logger.info(`SQLite 数据库初始化成功，SQLite 数据库文件路径：${config.sqlite.databaseUrl}`)
}

export const sqliteDb = drizzle({ client: sqlite })
