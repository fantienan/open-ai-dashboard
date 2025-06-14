import path from 'path'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { logger } from '../utils/logger.ts'
import { createSqlite } from '../utils/sqlite.ts'

export const runMigrate = () => {
  try {
    logger.info('🔍 数据库迁移')
    if (!process.env.SQLITE_DATABASE_URL) throw new Error('sqlite 数据库 URL 未定义')
    const db = drizzle({ client: createSqlite() })
    logger.info('⏳ 开始迁移...')
    const start = Date.now()
    const migrationsFolder = path.join(import.meta.dirname, './migrations')
    migrate(db, { migrationsFolder })
    const end = Date.now()
    logger.info(`✅ 迁移完成，用时 ${end - start} ms`)
  } catch (e) {
    logger.error('❌ 数据库迁移失败:', e)
  }
}
