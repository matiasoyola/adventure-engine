import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db/client'
import { users, progress } from '@/lib/db/schema'
import { loadAdventure } from '@/lib/engine/content-loader'
import { createInitialState } from '@/lib/engine/game-engine'
import type { CreateUserRequest } from '@/lib/engine/types'

export async function GET() {
  try {
    const all = await db.select().from(users)
    return NextResponse.json(all)
  } catch (err) {
    console.error('[GET /api/users]', err)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateUserRequest
    const { name, avatar, adventureId } = body

    if (!name || !avatar || !adventureId) {
      return NextResponse.json({ error: 'name, avatar y adventureId son obligatorios' }, { status: 400 })
    }

    const adventure = loadAdventure(adventureId)
    const userId = `usr_${nanoid(8)}`
    const progressId = `prg_${nanoid(8)}`
    const now = new Date().toISOString()
    const initialState = createInitialState(adventure)

    await db.transaction(async (tx) => {
      await tx.insert(users).values({ id: userId, name, avatar, createdAt: now })
      await tx.insert(progress).values({
        id: progressId, userId, adventureId,
        state: JSON.stringify(initialState), updatedAt: now,
      })
    })

    return NextResponse.json({ id: userId, name, avatar }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/users]', err)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
