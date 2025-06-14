import type { FastifyServerOptions } from 'fastify'
import { getPinoOptions } from './pino-options.ts'

export const getFastifyOptions = () => {
  console.info('初始化日志')

  const options: FastifyServerOptions = {
    logger: getPinoOptions(),
  }

  console.info('日志初始化成功')

  return options
}
