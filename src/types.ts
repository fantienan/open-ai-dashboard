import * as DatabaseSchema from '@@/ai-server/database/schema'
import type { AnalyzeResultSchema, DashboardSchema } from '@ai-dashboard/common/utils'

export * from '@ai-dashboard/common/types'

export type { DashboardSchema, AnalyzeResultSchema }

export type ChatVisibilityType = DatabaseSchema.Chat['visibility']

export type User = DatabaseSchema.User

export type Chat = DatabaseSchema.Chat
export type DBMessage = DatabaseSchema.DBMessage
export type Vote = DatabaseSchema.Vote

export type DownloadCodeParams = Pick<DBMessage, 'chatId'> & {
  messageId: DBMessage['id']
}

export type BizScope = {
  config: {
    SM_MAPBOX_TOKEN: string
    SM_GEOVIS_TOKEN: string
    SM_TIANDITU_TOKEN: string
  }
}

export type DashboardRecord = Omit<DatabaseSchema.Dashboard, 'data'> & {
  data: DashboardSchema
}

export type MetadataInfo = DatabaseSchema.MetadataInfo
