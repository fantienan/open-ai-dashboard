import { appendResponseMessages, createDataStreamResponse, streamText } from 'ai'
import type { FastifyInstance } from 'fastify'
import type { FastifyZodOpenApiTypeProvider } from 'fastify-zod-openapi'
import type { User } from '../database/schema.ts'
import { ChatContext } from '../decorates/agent/context.ts'
import { createLlmService } from '../services/index.ts'

export default async function (fastify: FastifyInstance) {
  const agentController = fastify.bizAgentController
  const llmSchema = fastify.bizSchemas.llm
  const model = agentController.utils.llmProvider.languageModel('chat-model-reasoning')
  const service = createLlmService(fastify)

  const getChatById = async (id: string, user: User) => {
    const chat = await service.chat.queryById({ id })
    if (!chat || !chat.data) {
      return fastify.BizResult.error({ code: 404, message: 'Chat not found' })
    }
    if (chat.data.userId !== user.id) {
      return fastify.BizResult.error({ code: 401, message: 'Unauthorized' })
    }
    return chat
  }

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
    fastify.bizAppConfig.routes.llm.chat,
    {
      schema: {
        body: llmSchema.chat.self,
      },
    },
    async function (request, reply) {
      const { messages, id } = request.body
      const userMessage = agentController.utils.getMostRecentUserMessage(messages)
      const { session } = request
      if (!userMessage) {
        return fastify.bizError.createBizError(fastify.BizResult.AI_CHAT_ERROR, { message: 'No user message found' })
      }
      const chatRes = await service.chat.queryById({ id })
      let chat = chatRes.data
      if (!chat) {
        const title = await agentController.utils.generateTitleFromUserMessage({ message: userMessage })
        chat = (await service.chat.insert({ userId: session.user.id, title, id })).data
        if (!chat) return fastify.BizResult.error({ code: 404, message: 'Chat not found' })
      } else if (chat.userId !== session.user.id) {
        return fastify.BizResult.error({ code: 401, message: 'Unauthorized' })
      }

      await service.message.insert({
        messages: [
          {
            chatId: chat.id,
            id: userMessage.id,
            role: 'user',
            parts: userMessage.parts,
            attachments: userMessage.experimental_attachments ?? [],
          },
        ],
      })

      reply.header('Content-Type', 'text/plain; charset=utf-8')
      return reply.send(
        createDataStreamResponse({
          execute: async (dataStream) => {
            const userNeeds = await agentController.utils.analyzeUserNeeds(messages)
            const chatContext = new ChatContext({ dataStream, ...userNeeds })
            const agent = agentController.getAgentByUserNeeds(chatContext)
            const { isCreateDashboard } = userNeeds

            const result = streamText({
              maxSteps: 10,
              model: agent?.model ?? model,
              system: agentController.utils.systemPrompt({ type: isCreateDashboard ? 'dashboard' : 'regular' }),
              messages,
              tools: agent?.createTools?.(),
              // experimental_transform: smoothStream({ chunking: 'word' }),
              experimental_generateMessageId: chatContext.genUUID,
              onStepFinish: async (p) => {
                agent?.onStepFinish(p)
              },
              onFinish: async ({ response }) => {
                if (session.user?.id) {
                  try {
                    const messageId = agentController.utils.getTrailingMessageId({
                      messages: response.messages.filter((message) => message.role === 'assistant'),
                    })

                    if (!messageId) {
                      throw fastify.bizError.createBizError(fastify.BizResult.AI_CHAT_ERROR, {
                        message: 'No assistant message found!',
                      })
                    }

                    const [, assistantMessage] = appendResponseMessages({
                      messages: [userMessage],
                      responseMessages: response.messages,
                    })

                    await service.message.insert({
                      messages: [
                        {
                          id: messageId,
                          chatId: chat.id,
                          role: assistantMessage.role,
                          parts: assistantMessage.parts,
                          attachments: assistantMessage.experimental_attachments ?? [],
                        },
                      ],
                    })

                    if (chatContext.dashboardSchema) {
                      await service.dashboard.insert({
                        chatId: chat.id,
                        messageId,
                        data: chatContext.dashboardSchema,
                        userId: session.user.id,
                      })
                    }
                  } catch (e) {
                    fastify.log.error(e, 'Failed to save message')
                  }
                }
              },
              experimental_telemetry: { isEnabled: true, functionId: 'stream-text' },
            })
            result.consumeStream()
            result.mergeIntoDataStream(dataStream, { sendReasoning: true })
          },
          onError: (error) => {
            fastify.log.error(error)
            return 'Oops, an error occured!'
          },
        }),
      )
    },
  )

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
    fastify.bizAppConfig.routes.llm.chat + '/insert',
    {
      schema: {
        body: llmSchema.chat.insert,
      },
    },
    async function (request) {
      return service.chat.insert(request.body)
    },
  )

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    fastify.bizAppConfig.routes.llm.chat + '/queryById',
    {
      schema: {
        querystring: llmSchema.chat.queryById,
      },
    },
    async function (request) {
      return service.chat.queryById(request.query)
    },
  )
  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
    fastify.bizAppConfig.routes.llm.chat + '/update',
    {
      schema: {
        body: llmSchema.chat.update,
      },
    },
    async function (request) {
      return service.chat.update(request.body)
    },
  )

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    fastify.bizAppConfig.routes.llm.chat + '/history',
    {
      schema: {
        querystring: llmSchema.chat.history,
      },
    },
    async function (request) {
      return service.chat.history({ ...request.query, limit: request.query.limit ?? 10, id: request.session.user.id })
    },
  )

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().delete(
    fastify.bizAppConfig.routes.llm.chat,
    {
      schema: {
        body: llmSchema.chat.delete,
      },
    },
    async function (request) {
      const chat = await getChatById(request.body.id, request.session.user)
      if (!chat.success) return chat
      return service.chat.delete(request.body)
    },
  )

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    fastify.bizAppConfig.routes.llm.vote,
    {
      schema: {
        querystring: llmSchema.vote.self,
      },
    },
    async function (request) {
      const chat = await getChatById(request.query.chatId, request.session.user)
      if (!chat.success) return chat
      const votes = await service.vote.queryByChatId(request.query)
      return fastify.BizResult.success({ data: votes })
    },
  )
  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().patch(
    fastify.bizAppConfig.routes.llm.vote,
    {
      schema: {
        body: llmSchema.vote.batch,
      },
    },
    async function (request) {
      const chat = await getChatById(request.body.chatId, request.session.user)
      if (!chat.success) return chat
      return service.vote.update(request.body)
    },
  )
  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().get(
    fastify.bizAppConfig.routes.llm.message + '/queryByChatId',
    {
      schema: {
        querystring: llmSchema.message.queryByChatId,
      },
    },
    async function (request) {
      const chat = await getChatById(request.query.chatId, request.session.user)
      if (!chat.success) return chat
      return service.message.queryMessageByChatId(request.query)
    },
  )

  fastify.withTypeProvider<FastifyZodOpenApiTypeProvider>().post(
    fastify.bizAppConfig.routes.llm.dashboard + '/query',
    {
      schema: { body: fastify.bizSchemas.llm.dashboard.query },
    },
    async function (request) {
      return service.dashboard.query(request.body)
    },
  )
}
