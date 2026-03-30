import { NextResponse } from 'next/server'
import { eq, desc } from 'drizzle-orm'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db/client'
import { photos, children } from '@/lib/db/schema'
import { loadAdventure } from '@/lib/engine/content-loader'

// GET /api/photos?adventureId=xxx — galería completa de una aventura
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const adventureId = searchParams.get('adventureId')
    if (!adventureId) return NextResponse.json({ error: 'adventureId requerido' }, { status: 400 })

    const all = await db
      .select()
      .from(photos)
      .where(eq(photos.adventureId, adventureId))
      .orderBy(desc(photos.createdAt))

    return NextResponse.json(all)
  } catch (err) {
    console.error('[GET /api/photos]', err)
    return NextResponse.json({ error: 'Error al obtener fotos' }, { status: 500 })
  }
}

// POST /api/photos — subir foto (multipart/form-data)
// Body: file (File), childId, adventureId, zoneId, stepId
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file        = formData.get('file') as File | null
    const childId     = formData.get('childId') as string
    const adventureId = formData.get('adventureId') as string
    const zoneId      = formData.get('zoneId') as string
    const stepId      = formData.get('stepId') as string

    if (!file || !childId || !adventureId || !zoneId || !stepId) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Validar tamaño máximo 10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'La foto no puede superar 10MB' }, { status: 400 })
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 })
    }

    const child = await db.query.children.findFirst({ where: eq(children.id, childId) })
    if (!child) return NextResponse.json({ error: 'Explorador no encontrado' }, { status: 404 })

    const adventure = loadAdventure(adventureId)
    const zone = adventure.zones.find(z => z.id === zoneId)
    if (!zone) return NextResponse.json({ error: 'Zona no encontrada' }, { status: 404 })

    // Guardar archivo en /public/uploads/
    const ext     = file.type === 'image/png' ? 'png' : 'jpg'
    const photoId = `pho_${nanoid(8)}`
    const filename = `${photoId}.${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')

    await mkdir(uploadDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadDir, filename), buffer)

    const url = `/uploads/${filename}`

    // Guardar en BD
    await db.insert(photos).values({
      id:          photoId,
      childId,
      childName:   child.name,
      childAvatar: child.avatar,
      adventureId,
      zoneId,
      zoneName:    zone.name,
      stepId,
      url,
      createdAt:   new Date().toISOString(),
    })

    return NextResponse.json({ id: photoId, url }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/photos]', err)
    return NextResponse.json({ error: 'Error al subir foto' }, { status: 500 })
  }
}
