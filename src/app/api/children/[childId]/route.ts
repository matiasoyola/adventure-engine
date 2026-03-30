import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { children } from '@/lib/db/schema'

type Params = { params: { childId: string } }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    const updates: Record<string, string> = {}
    if (body.name)   updates.name   = body.name
    if (body.avatar) updates.avatar = body.avatar
    await db.update(children).set(updates).where(eq(children.id, params.childId))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await db.delete(children).where(eq(children.id, params.childId))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
