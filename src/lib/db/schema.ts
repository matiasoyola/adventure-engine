import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

// =============================================================================
// adults — moderadores del juego, uno por familia
// PIN de 4 dígitos para acceder al modo adulto
// =============================================================================
export const adults = sqliteTable('adults', {
  id:          text('id').primaryKey(),               // "adt_xxxxxxxx"
  name:        text('name').notNull(),
  avatar:      text('avatar').notNull(),
  pin:         text('pin').notNull(),                 // 4 dígitos, sin hash en MVP
  adventureId: text('adventure_id').notNull(),
  createdAt:   text('created_at').notNull(),
})

// =============================================================================
// children — exploradores del juego, dependen de un adulto
// Sin contraseña — selección por avatar
// =============================================================================
export const children = sqliteTable('children', {
  id:        text('id').primaryKey(),                 // "kid_xxxxxxxx"
  name:      text('name').notNull(),
  avatar:    text('avatar').notNull(),
  parentId:  text('parent_id').notNull().references(() => adults.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
})

// =============================================================================
// progress — estado de juego por niño
// Un registro por niño (en MVP, una aventura activa)
// state: JSON blob con ProgressState completo
// =============================================================================
export const progress = sqliteTable('progress', {
  id:          text('id').primaryKey(),
  childId:     text('child_id').notNull().references(() => children.id, { onDelete: 'cascade' }),
  adventureId: text('adventure_id').notNull(),
  state:       text('state').notNull(),               // JSON blob: ProgressState
  updatedAt:   text('updated_at').notNull(),
})

export type Adult    = typeof adults.$inferSelect
export type Child    = typeof children.$inferSelect
export type Progress = typeof progress.$inferSelect
export type NewAdult = typeof adults.$inferInsert
export type NewChild = typeof children.$inferInsert
