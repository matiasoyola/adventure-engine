import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { users, progress } from '@/lib/db/schema'
import { loadAdventure } from '@/lib/engine/content-loader'
import { mergeState, applyAction } from '@/lib/engine/game-engine'
import type { ActionRequest, ProgressState, ProgressResponse } from '@/lib/engine/types'

type Params = { params: { userId: string } }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { userId } = params
    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const prog = await db.query.progress.findFirst({ where: eq(progress.userId, userId) })
    if (!prog) return NextResponse.json({ error: 'Progreso no encontrado' }, { status: 404 })

    const adventure = loadAdventure(prog.adventureId)
    const state = JSON.parse(prog.state) as ProgressState
    const gameState = mergeState(adventure, state)

    const response: ProgressResponse = {
      user: { id: user.id, name: user.name, avatar: user.avatar },
      gameState,
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[GET /api/progress]', err)
    return NextResponse.json({ error: 'Error al obtener progreso' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { userId } = params
    const body = (await req.json()) as ActionRequest

    if (!body.action?.type) {
      return NextResponse.json({ error: 'action.type es obligatorio' }, { status: 400 })
    }

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const prog = await db.query.progress.findFirst({ where: eq(progress.userId, userId) })
    if (!prog) return NextResponse.json({ error: 'Progreso no encontrado' }, { status: 404 })

    const adventure = loadAdventure(prog.adventureId)
    const currentState = JSON.parse(prog.state) as ProgressState
    const nextState = applyAction(adventure, currentState, body.action)

    if (nextState !== currentState) {
      await db.update(progress)
        .set({ state: JSON.stringify(nextState), updatedAt: new Date().toISOString() })
        .where(eq(progress.userId, userId))
    }

    const gameState = mergeState(adventure, nextState)
    const response: ProgressResponse = {
      user: { id: user.id, name: user.name, avatar: user.avatar },
      gameState,
    }
    return NextResponse.json(response)
  } catch (err) {
    console.error('[PATCH /api/progress]', err)
    return NextResponse.json({ error: 'Error al actualizar progreso' }, { status: 500 })
  }
}
