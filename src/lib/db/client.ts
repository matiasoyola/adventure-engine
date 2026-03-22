import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import * as schema from './schema'

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

const globalForDb = globalThis as unknown as { db: DrizzleDb | undefined }

function createDb(): DrizzleDb {
  const rawPath = process.env.DATABASE_URL ?? path.join(process.cwd(), 'adventure.db')

  if (process.env.NODE_ENV === 'production' && !path.isAbsolute(rawPath)) {
    throw new Error(
      `DATABASE_URL debe ser una ruta absoluta en producción.\n` +
      `Valor recibido: "${rawPath}"\n` +
      `Ejemplo: "/var/www/adventure-engine/data/adventure.db"`
    )
  }

  const sqlite = new Database(rawPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('synchronous = NORMAL')
  return drizzle(sqlite, { schema })
}

export const db = globalForDb.db ?? createDb()
globalForDb.db = db
