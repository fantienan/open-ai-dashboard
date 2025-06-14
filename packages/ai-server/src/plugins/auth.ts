import { BizResult } from '@ai-dashboard/common/types'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import ky from 'ky'
import { type User } from '../database/schema.ts'

async function authPlugin(fastify: FastifyInstance) {
  const { whitelistRoutes } = fastify.bizAppConfig

  function isWhitelistedRoute(url: string): boolean {
    return whitelistRoutes.some((route) => {
      // 支持精确匹配和前缀匹配
      return url === route || url.startsWith(route + '/')
    })
  }

  fastify.decorate('bizAuthenticate', async function (request, reply) {
    try {
      if (isWhitelistedRoute(request.url)) return
      const { headers } = request
      const token = headers.authorization
      if (!token) {
        reply.status(401).send(fastify.BizResult.error({ code: 401, message: 'Unauthorized' }))
        return
      }
      const result = await ky
        .get<BizResult<{ user: User }>>(`${fastify.bizAppConfig.webServerBaseUrl}/auth/certification`, {
          headers: {
            Authorization: headers.authorization,
          },
        })
        .json()
      if (!result.success || !result.data || !result.data.user) {
        reply.status(401).send(fastify.BizResult.error({ code: 401, message: 'Unauthorized' }))
        return
      }
      request.session = { ...request.session, user: result.data.user }
    } catch (error) {
      console.error('Authentication failed:', error)
      reply.status(500).send(fastify.BizResult.error({ code: 500, message: 'Internal Server Error' }))
      return
    }
  })
}

export default fp(authPlugin, {
  fastify: '5.x',
  name: 'auth',
})
