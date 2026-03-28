import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db/client'
import { children, adults, progress } from '@/lib/db/schema'
import { loadAdventure } from '@/lib/engine/content-loader'
import { createInitialState } from '@/lib/engine/game-engine'
import type { CreateChildRequest } from '@/lib/engine/types'

// GET /api/children — todos los niños (para pantalla de selección)
export async function GET() {
  try {
    const all = await db
      .select({
        id: children.id, name: children.name, avatar: children.avatar,
        parentId: children.parentId, parentName: adults.name,
      })
      .from(children)
      .leftJoin(adults, eq(children.parentId, adults.id))
    return NextResponse.json(all)
  } catch (err) {
    console.error('[GET /api/children]', err)
    return NextResponse.json({ error: 'Error al obtener exploradores' }, { status: 500 })
  }
}

// POST /api/children — crear nuevo explorador bajo un adulto
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateChildRequest
    const { name, avatar, parentId } = body

    if (!name || !avatar || !parentId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const parent = await db.query.adults.findFirst({ where: eq(adults.id, parentId) })
    if (!parent) return NextResponse.json({ error: 'Adulto no encontrado' }, { status: 404 })

    const adventure = loadAdventure(parent.adventureId)
    const childId   = `kid_${nanoid(8)}`
    const progId    = `prg_${nanoid(8)}`
    const now       = new Date().toISOString()
    const initState = createInitialState(adventure)

    await db.transaction(async tx => {
      await tx.insert(children).values({ id: childId, name, avatar, parentId, createdAt: now })
      await tx.insert(progress).values({
        id: progId, childId, adventureId: parent.adventureId,
        state: JSON.stringify(initState), updatedAt: now,
      })
    })

    return NextResponse.json({ id: childId, name, avatar }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/children]', err)
    return NextResponse.json({ error: 'Error al crear explorador' }, { status: 500 })
  }
}
