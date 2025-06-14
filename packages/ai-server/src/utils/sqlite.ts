import Database, { type Options } from 'better-sqlite3'
import { config } from '../config/index.ts'

export const createSqlite = (options?: Options) => {
  return new Database(config.sqlite.databaseUrl, { nativeBinding: process.env.SQLITE_BINDING, ...options })
}
