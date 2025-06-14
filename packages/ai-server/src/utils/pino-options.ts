import path from 'node:path'
import sea from 'node:sea'
import { LoggerOptions } from 'pino'
import { config } from '../config/index.ts'

export const getPinoOptions = () => {
  const { extension, dateFormat, translateTime, frequency, filePrefix, dir } = config.pino
  const pinoPretty: LoggerOptions['transport'] = {
    target: 'pino-pretty',
    options: {
      translateTime,
      colorize: true,
    },
  }
  const pinoRoll: LoggerOptions['transport'] = {
    target: 'pino-roll',
    options: {
      file: path.join(dir, filePrefix),
      frequency, // 按天滚动
      translateTime, // 日志时间格式
      mkdir: true,
      extension, // 日志文件扩展名
      dateFormat,
    },
  }

  if (sea.isSea()) {
    pinoPretty.options = {
      colorize: false, // sea 环境下不使用颜色
      ignore: 'time,level',
    }
    return {
      transport: {
        targets: [pinoPretty],
      },
    }
  }

  return {
    transport: {
      targets: [pinoPretty, pinoRoll],
    },
  }
}
