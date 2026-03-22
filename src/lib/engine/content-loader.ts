import { z } from 'zod'
import path from 'path'
import fs from 'fs'
import type { AdventureContent } from './types'

const StepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  text: z.string().min(1),
  type: z.enum(['check', 'photo']),
})

const BadgeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().min(1),
})

const ZoneSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  narrative: z.string().min(1),
  icon: z.string().min(1),
  suggestedOrder: z.number().int().positive(),
  badge: BadgeSchema,
  steps: z.array(StepSchema).min(1),
})

const AdventureSchema = z.object({
  id: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  title: z.string().min(1),
  description: z.string().min(1),
  coverImage: z.string().min(1),
  zones: z.array(ZoneSchema).min(1),
})

const cache = new Map<string, AdventureContent>()

export function loadAdventure(adventureId: string): AdventureContent {
  if (cache.has(adventureId)) return cache.get(adventureId)!

  const filePath = path.join(process.cwd(), 'content', 'adventures', `${adventureId}.json`)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Aventura no encontrada: ${adventureId}`)
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(raw)
  const result = AdventureSchema.safeParse(parsed)

  if (!result.success) {
    const issues = result.error.issues.map(i => `[${i.path.join('.')}] ${i.message}`).join('\n')
    throw new Error(`Aventura "${adventureId}" inválida:\n${issues}`)
  }

  const adventure = result.data as AdventureContent
  cache.set(adventureId, adventure)
  return adventure
}

export function clearAdventureCache(): void {
  cache.clear()
}
