import { FastifyInstance } from 'fastify'
import llm from './llm.ts'

const controllers = async (fastify: FastifyInstance) => {
  fastify.register(llm, { prefix: fastify.bizAppConfig.routes.llm.prefix })
}

export default controllers
