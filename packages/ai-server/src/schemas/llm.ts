import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod'
import { z } from 'zod'
import * as schema from '../database/schema.ts'

export const llm = {
  chat: {
    self: z.object({
      id: z.string({ description: '聊天记录id' }),
      messages: z.any({ description: '消息列表' }),
    }),
    insert: createInsertSchema(schema.chat).omit({ id: true, createdAt: true }),
    update: createUpdateSchema(schema.chat).required({ id: true }),
    queryById: createSelectSchema(schema.chat).pick({ id: true }).required({ id: true }),
    delete: z.object({ id: z.string({ description: '聊天记录id' }) }),
    history: z
      .object({
        limit: z
          .union([z.string().transform((val) => parseInt(val, 10)), z.number()])
          .default(10)
          .optional()
          .describe('每一页的数据数量'),
        startingAfter: z.string({ description: '分页的起始id' }).optional(),
        endingBefore: z.string({ description: '分页的结束id' }).optional(),
      })
      .refine((data) => !(data.startingAfter && data.endingBefore), {
        message: 'startingAfter 和 endingBefore 不能同时提供',
        path: ['startingAfter', 'endingBefore'],
      }),
  },
  message: {
    queryByChatId: createSelectSchema(schema.message).pick({ chatId: true }).required({ chatId: true }),
  },
  vote: {
    self: z.object({ chatId: z.string({ description: '聊天记录id' }) }),
    batch: createInsertSchema(schema.vote),
  },
  dashboard: {
    query: createSelectSchema(schema.dashboard).pick({ chatId: true, messageId: true }),
  },
}
