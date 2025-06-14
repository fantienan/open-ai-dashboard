import { logger } from '../../../utils/index.ts'
import { createSqlite } from '../../../utils/sqlite.ts'

export function getErrorMessage(error: unknown) {
  if (error == null) {
    return 'unknown error'
  }

  if (typeof error === 'string') {
    return error
  }

  if (error instanceof Error) {
    return error.message
  }

  return JSON.stringify(error)
}

export function getDatabase() {
  return createSqlite({
    verbose: (a, b, ...args) => {
      logger.info(a, (b as any)?.toString(), ...args)
    },
  })
}
