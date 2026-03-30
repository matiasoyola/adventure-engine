import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const adults = sqliteTable('adults', {
  id:          text('id').primaryKey(),
  name:        text('name').notNull(),
  avatar:      text('avatar').notNull(),
  pin:         text('pin').notNull(),
  adventureId: text('adventure_id').notNull(),
  createdAt:   text('created_at').notNull(),
})

export const children = sqliteTable('children', {
  id:        text('id').primaryKey(),
  name:      text('name').notNull(),
  avatar:    text('avatar').notNull(),
  parentId:  text('parent_id').notNull().references(() => adults.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
})

export const progress = sqliteTable('progress', {
  id:          text('id').primaryKey(),
  childId:     text('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  adventureId: text('adventure_id').notNull(),
  state:       text('state').notNull(),
  updatedAt:   text('updated_at').notNull(),
})

export const photos = sqliteTable('photos', {
  id:          text('id').primaryKey(),
  childId:     text('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  childName:   text('child_name').notNull(),
  childAvatar: text('child_avatar').notNull(),
  adventureId: text('adventure_id').notNull(),
  zoneId:      text('zone_id').notNull(),
  zoneName:    text('zone_name').notNull(),
  stepId:      text('step_id').notNull(),
  url:         text('url').notNull(),
  createdAt:   text('created_at').notNull(),
})

export type Adult    = typeof adults.$inferSelect
export type Child    = typeof children.$inferSelect
export type Progress = typeof progress.$inferSelect
export type Photo    = typeof photos.$inferSelect
