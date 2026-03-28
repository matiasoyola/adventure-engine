import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db/client'
import { adults } from '@/lib/db/schema'
import { loadAdventure } from '@/lib/engine/content-loader'
import type { CreateAdultRequest, LoginAdultRequest } from '@/lib/engine/types'

// GET /api/adults — lista todos los adultos (para pantalla de selección)
export async function GET() {
  try {
    const all = await db.select({
      id: adults.id, name: adults.name, avatar: adults.avatar, adventureId: adults.adventureId,
    }).from(adults)
    return NextResponse.json(all)
  } catch (err) {
    console.error('[GET /api/adults]', err)
    return NextResponse.json({ error: 'Error al obtener adultos' }, { status: 500 })
  }
}

// POST /api/adults — registrar nuevo adulto moderador
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateAdultRequest
    const { name, avatar, pin, adventureId } = body

    if (!name || !avatar || !pin || !adventureId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: 'El PIN debe ser de 4 dígitos' }, { status: 400 })
    }

    // Validar que la aventura existe
    loadAdventure(adventureId)

    const id = `adt_${nanoid(8)}`
    await db.insert(adults).values({ id, name, avatar, pin, adventureId, createdAt: new Date().toISOString() })

    return NextResponse.json({ id, name, avatar }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/adults]', err)
    return NextResponse.json({ error: 'Error al crear adulto' }, { status: 500 })
  }
}

// PUT /api/adults — login adulto con PIN (devuelve adulto + hijos si PIN correcto)
export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as LoginAdultRequest
    const { adultId, pin } = body

    const adult = await db.query.adults.findFirst({ where: eq(adults.id, adultId) })
    if (!adult) return NextResponse.json({ error: 'Adulto no encontrado' }, { status: 404 })
    if (adult.pin !== pin) return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })

    return NextResponse.json({ id: adult.id, name: adult.name, avatar: adult.avatar })
  } catch (err) {
    console.error('[PUT /api/adults]', err)
    return NextResponse.json({ error: 'Error en login' }, { status: 500 })
  }
}
