import { z } from 'zod'

export const data = {
  getMetadata: z.object({ tableName: z.string({ description: '表名' }) }),
}
