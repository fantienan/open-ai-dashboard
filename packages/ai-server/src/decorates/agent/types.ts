import type { DataStreamWriter } from 'ai'

export interface CreateToolParams {
  dataStream: DataStreamWriter
  genUUID: () => string
}
