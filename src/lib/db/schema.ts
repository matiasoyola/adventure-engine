import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const users = sqliteTable('users', {
  id:        text('id').primaryKey(),
  name:      text('name').notNull(),
  avatar:    text('avatar').notNull(),
  createdAt: text('created_at').notNull(),
})

export const progress = sqliteTable('progress', {
  id:          text('id').primaryKey(),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  adventureId: text('adventure_id').notNull(),
  state:       text('state').notNull(),
  updatedAt:   text('updated_at').notNull(),
})

export type User     = typeof users.$inferSelect
export type Progress = typeof progress.$inferSelect
export type NewUser  = typeof users.$inferInsert
