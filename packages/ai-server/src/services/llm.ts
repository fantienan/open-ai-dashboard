import { MakeOptional, MakeReqiured, MakeRequiredAndOptional } from '@ai-dashboard/common/types'
import { BizResult } from '@ai-dashboard/common/types'
import { SQL, and, asc, desc, eq, gt, lt } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import ky from 'ky'
import { z } from 'zod'
import { type User, chat, dashboard, message, vote } from '../database/schema.ts'
import * as schemas from '../schemas/index.ts'

export type LlmService = ReturnType<typeof createLlmService>

type LlmServiceHistoryParams = MakeReqiured<z.infer<typeof schemas.llm.chat.history>, 'limit'> & { id: string }

export const createLlmService = (fastify: FastifyInstance) => {
  const db = fastify.bizDb
  async function getChatsByUserId({ id, limit, startingAfter, endingBefore }: LlmServiceHistoryParams) {
    try {
      const extendedLimit = limit + 1

      const query = async (whereCondition?: SQL<any>) => {
        return db
          .select()
          .from(chat)
          .where(whereCondition ? and(whereCondition, eq(chat.userId, id)) : eq(chat.userId, id))
          .orderBy(desc(chat.createdAt))
          .limit(extendedLimit)
      }

      let filteredChats: (typeof chat.$inferSelect)[] = []

      if (startingAfter) {
        const [selectedChat] = await db.select().from(chat).where(eq(chat.id, startingAfter)).limit(1)

        if (!selectedChat) {
          throw new Error(`Chat with id ${startingAfter} not found`)
        }

        filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt))
      } else if (endingBefore) {
        const [selectedChat] = await db.select().from(chat).where(eq(chat.id, endingBefore)).limit(1)

        if (!selectedChat) {
          throw new Error(`Chat with id ${endingBefore} not found`)
        }

        filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt))
      } else {
        filteredChats = await query()
      }
      const hasMore = filteredChats.length > limit

      return {
        chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
        hasMore,
      }
    } catch (error) {
      console.error('Failed to get chats by user from database')
      throw error
    }
  }

  async function deleteChatById({ id }: Pick<typeof chat.$inferSelect, 'id'>) {
    try {
      await db.delete(dashboard).where(eq(dashboard.chatId, id))
      await db.delete(vote).where(eq(vote.chatId, id))
      await db.delete(message).where(eq(message.chatId, id))

      return await db.delete(chat).where(eq(chat.id, id))
    } catch (error) {
      console.error('Failed to delete chat by id from database')
      throw error
    }
  }

  async function voteMessage({ messageId, chatId, isUpvoted }: typeof vote.$inferInsert) {
    try {
      const [existingVote] = await db
        .select()
        .from(vote)
        .where(and(eq(vote.messageId, messageId)))

      if (existingVote) {
        return await db
          .update(vote)
          .set({ isUpvoted })
          .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)))
      }
      return await db.insert(vote).values({ chatId, messageId, isUpvoted })
    } catch (error) {
      console.error('Failed to upvote message in database', error)
      throw error
    }
  }
  return {
    user: {
      query: async function () {
        try {
          const result = await ky.get<BizResult<User>>(`${fastify.bizAppConfig.webServerBaseUrl}/user/find`).json()
          return result
        } catch (error) {
          fastify.log.error(error)
          throw error
        }
      },
    },
    chat: {
      insert: async function (params: typeof chat.$inferInsert) {
        try {
          const result = await db.insert(chat).values(params).returning()
          return fastify.BizResult.success({ data: result[0] })
        } catch (error) {
          fastify.log.error(error)
          throw error
        }
      },
      queryById: async function (params: Pick<typeof chat.$inferSelect, 'id'>) {
        try {
          const result = await db.select().from(chat).where(eq(chat.id, params.id)).limit(1)
          return fastify.BizResult.success({ data: result[0] })
        } catch (error) {
          fastify.log.error(error)
          throw error
        }
      },
      update: async function (params: MakeRequiredAndOptional<typeof chat.$inferSelect, 'id'>) {
        try {
          const { id, ...values } = params
          const result = await db.update(chat).set(values).where(eq(chat.id, id)).returning().limit(1)
          return fastify.BizResult.success({ data: result[0] })
        } catch (error) {
          fastify.log.error(error)
          throw error
        }
      },
      delete: async function (params: Pick<typeof chat.$inferSelect, 'id'>) {
        try {
          await deleteChatById(params)
          return fastify.BizResult.success()
        } catch (error) {
          fastify.log.error(error)
          throw error
        }
      },
      history: async function (params: LlmServiceHistoryParams) {
        try {
          const result = await getChatsByUserId(params)
          return fastify.BizResult.success({ data: result })
        } catch (error) {
          fastify.log.error(error)
          throw error
        }
      },
    },
    message: {
      insert: async function (params: { messages: MakeOptional<typeof message.$inferSelect, 'createdAt'>[] }) {
        try {
          const result = await db.insert(message).values(params.messages).returning()
          return fastify.BizResult.success({ data: result[0] })
        } catch (error) {
          fastify.log.error(error)
          throw error
        }
      },
      queryById: async function (id: (typeof message.$inferSelect)['id']) {
        try {
          const result = await db.select().from(message).where(eq(message.id, id)).limit(1)
          return fastify.BizResult.success({ data: result[0] })
        } catch (error) {
          fastify.log.error(error)
          throw error
        }
      },
      queryMessageByChatId: async function (params: Pick<typeof message.$inferSelect, 'chatId'>) {
        try {
          const result = await db
            .select()
            .from(message)
            .where(eq(message.chatId, params.chatId))
            .orderBy(asc(message.createdAt))
          return fastify.BizResult.success({ data: result })
        } catch (error) {
          console.error('Failed to get messages by chat id from database', error)
          throw error
        }
      },
    },
    vote: {
      queryByChatId: async function (params: Pick<typeof vote.$inferSelect, 'chatId'>) {
        try {
          return await db.select().from(vote).where(eq(vote.chatId, params.chatId))
        } catch (error) {
          console.error('Failed to get votes by chat id from database', error)
          throw error
        }
      },
      update: async function (params: typeof vote.$inferInsert) {
        try {
          await voteMessage(params)
          return fastify.BizResult.success()
        } catch (error) {
          fastify.log.error(error)
          throw error
        }
      },
    },
    dashboard: {
      insert: async function (params: typeof dashboard.$inferInsert) {
        try {
          const result = await db.insert(dashboard).values(params).returning()
          return fastify.BizResult.success({ data: result[0] })
        } catch (error) {
          fastify.log.error(error)
          throw error
        }
      },
      query: async function (params: Pick<typeof dashboard.$inferSelect, 'chatId' | 'messageId'>) {
        try {
          const result = await db
            .select()
            .from(dashboard)
            .where(and(eq(dashboard.chatId, params.chatId), eq(dashboard.messageId, params.messageId)))
            .limit(1)
          return fastify.BizResult.success({ data: result[0] })
        } catch (error) {
          fastify.log.error(error)
          throw error
        }
      },
    },
  }
}
