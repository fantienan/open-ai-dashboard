import './config/env.ts'
import { dashboardSchema } from '@ai-dashboard/common/utils'
import Fastify from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-zod-openapi'
import { config } from './config/index.ts'
import { runMigrate } from './database/migrate.ts'
import { AgentController, Result, errors, sqliteDb } from './decorates/index.ts'
import * as schemas from './schemas/index.ts'
import { getFastifyOptions } from './utils/fastify.ts'

const main = async () => {
  runMigrate()
  const fastify = Fastify(getFastifyOptions())
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)
  fastify
    .decorate('bizAppConfig', config)
    .decorate('bizError', errors)
    .decorate('BizResult', Result)
    .decorate('bizAgentController', new AgentController())
    .decorate('bizDb', sqliteDb)
    .decorate('bizSchemas', schemas)
    .decorate('bizDashboardSchema', dashboardSchema)
    .register(import('@fastify/cors'), config.cors)
    .register(import('./plugins/auth.ts'))
    .addHook('onRequest', async (request, reply) => {
      await fastify.bizAuthenticate(request, reply)
    })
    .after(() => {
      fastify
        .get('/ping', () => ({ pong: 'it work' }))
        .register(import('./controllers/index.ts'), { prefix: config.routes.root })
    })

  await fastify.listen({ port: config.service.port, host: config.service.host })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
