import { type InferSelectModel } from 'drizzle-orm'
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { v4 as uuidv4 } from 'uuid'

export const dailySummary = sqliteTable('analyze_daily_summary', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => uuidv4()),
  customerCode: integer('customer_code').notNull(),
  memberCode: integer('member_code').notNull(),
  visitDate: text('visit_date', { length: 255 }).notNull(),
  visitTimePeriod: integer('visit_time_period').notNull(),
  weixinId: integer('weixin_id').notNull(),
  pv: integer().notNull(),
})

export const orderProductDetails = sqliteTable('analyze_order_product_details', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => uuidv4()),
  customerCode: integer('customer_code').notNull(),
  custormerType: text('custormer_type', { length: 255 }).notNull(),
  province: text({ length: 255 }).notNull(),
  city: text({ length: 255 }).notNull(),
  cityLevel: text('city_level', { length: 255 }).notNull(),
  storeType: text('store_type', { length: 255 }).notNull(),
  storeCode: integer('store_code').notNull(),
  custromerCode: integer('custromer_code').notNull(),
  babyAgeGroup: text('baby_age_group', { length: 255 }).notNull(),
  gender: text({ length: 255 }).notNull(),
  crowdType: text('crowd_type', { length: 255 }).notNull(),
  onlineOrder: text('online_order', { length: 255 }).notNull(),
  paymentDate: text('payment_date', { length: 255 }).notNull(),
  writeOffDate: text('write_off_date', { length: 255 }),
  associatedOrderNumber: text('associated_order_number', { length: 255 }),
  firstCategory: text('first_category', { length: 255 }).notNull(),
  secondaryCategory: text('secondary_category', { length: 255 }).notNull(),
  relatedFirstCategory: text('related_first_category', { length: 255 }).notNull(),
  relatedSecondaryCategory: text('related_secondary_category', { length: 255 }).notNull(),
  brandName: text('brand_name', { length: 255 }),
  relatedBrandName: text('related_brand_name', { length: 255 }),
  onlineCommodityCode: text('online_commodity_code', { length: 255 }).notNull(),
  relatedOnlineCommodityCode: text('related_online_commodity_code', { length: 255 }),
  marketingCampaignType: text('marketing_campaign_type', { length: 255 }).notNull(),
  sceneName: text('scene_name', { length: 255 }).notNull(),
  paymentWriteOffDaysDifference: integer('payment_write_off_days_difference'),
  onlineSales: real('online_sales').notNull(),
  relatedSales: real('related_sales').notNull(),
})

export const user = sqliteTable('user', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => uuidv4()),
  email: text('email', { length: 64 }).notNull(),
  password: text('password', { length: 64 }),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export type User = InferSelectModel<typeof user>

export const chat = sqliteTable('chat', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => uuidv4()),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  title: text('title').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id),
  visibility: text('visibility', { enum: ['public', 'private'] })
    .notNull()
    .default('private'),
})

export type Chat = InferSelectModel<typeof chat>

export const message = sqliteTable('message', {
  id: text('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => uuidv4()),
  chatId: text('chat_id')
    .notNull()
    .references(() => chat.id),
  role: text('role').notNull(),
  parts: text('parts', { mode: 'json' }).notNull(),
  attachments: text('attachments', { mode: 'json' }).notNull(),
  createdAt: text('created_at')
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
})

export type DBMessage = InferSelectModel<typeof message>

export const vote = sqliteTable(
  'vote',
  {
    chatId: text('chat_id')
      .notNull()
      .references(() => chat.id),
    messageId: text('message_id')
      .notNull()
      .references(() => message.id),
    isUpvoted: integer('is_upvoted', { mode: 'boolean' }).notNull(),
  },
  (table) => [primaryKey({ name: 'pk', columns: [table.chatId, table.messageId] })],
)

export type Vote = InferSelectModel<typeof vote>

export const dashboard = sqliteTable(
  'dashboard',
  {
    chatId: text('chat_id')
      .notNull()
      .references(() => chat.id),
    messageId: text('message_id')
      .notNull()
      .references(() => message.id),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id),
    data: text('data', { mode: 'json' }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.chatId, table.messageId], name: 'dashboard_chat_id_message_id_pk' })],
)

export type Dashboard = InferSelectModel<typeof dashboard>

export const metadataInfo = sqliteTable(
  'metadata_info',
  {
    columnName: text('column_name').notNull(),
    columnAliases: text('column_aliases').notNull(),
    columnType: text('column_type').notNull(),
    isNullable: integer('is_nullable', { mode: 'boolean' }).notNull(),
    columnDefault: text('column_default'),
    tableName: text('table_name').notNull(),
    tableAliases: text('table_aliases').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.columnName, table.tableName], name: 'metadata_info_column_name_table_name_pk' }),
  ],
)

export type MetadataInfo = InferSelectModel<typeof metadataInfo>

export const emailCode = sqliteTable(
  'email_code',
  {
    email: text('email', { length: 64 }).notNull(),
    code: text('code', { length: 6 }).notNull(),
    consumedAt: text('consumed_at'),
    createdAt: text('created_at')
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
  },
  (table) => [primaryKey({ columns: [table.email, table.code], name: 'email_code_email_code_pk' })],
)

export type EmailCode = InferSelectModel<typeof emailCode>
