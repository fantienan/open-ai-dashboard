import { pino } from 'pino'
import { getPinoOptions } from './pino-options.ts'

export const logger = pino(getPinoOptions())
