import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/client'
import { adults } from '@/lib/db/schema'

type Params = { params: { adultId: string } }

export async function PATCH(req: Request, { params }: Params) {
  try {
    const body = await req.json()
    const updates: Record<string, string> = {}
    if (body.name)   updates.name   = body.name
    if (body.avatar) updates.avatar = body.avatar
    if (body.pin) {
      if (!/^\d{4}$/.test(body.pin)) return NextResponse.json({ error: 'PIN debe ser 4 dígitos' }, { status: 400 })
      updates.pin = body.pin
    }
    await db.update(adults).set(updates).where(eq(adults.id, params.adultId))
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[PATCH /api/adults/:id]', err)
    return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    await db.delete(adults).where(eq(adults.id, params.adultId))
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
