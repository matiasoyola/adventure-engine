'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ProgressResponse, GameAction } from '@/lib/engine/types'

const CHILD_KEY = 'adventure_child_id'
const ADULT_KEY = 'adventure_adult_id'

export function getChildId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(CHILD_KEY)
}
export function setChildId(id: string) { localStorage.setItem(CHILD_KEY, id) }
export function clearChildId() { localStorage.removeItem(CHILD_KEY) }

export function getAdultId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ADULT_KEY)
}
export function setAdultId(id: string) { localStorage.setItem(ADULT_KEY, id) }
export function clearAdultId() { localStorage.removeItem(ADULT_KEY) }

export function useProgress() {
  const [data, setData]       = useState<ProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    const id = getChildId()
    if (!id) { setLoading(false); return }
    try {
      setLoading(true)
      const res = await fetch(`/api/progress/${id}`)
      if (!res.ok) throw new Error('No se pudo cargar el progreso')
      setData(await res.json() as ProgressResponse)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const dispatch = useCallback(async (action: GameAction) => {
    const id = getChildId()
    if (!id) return
    try {
      const res = await fetch(`/api/progress/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('No se pudo actualizar')
      setData(await res.json() as ProgressResponse)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    }
  }, [])

  return { data, loading, error, refresh: fetch_, dispatch }
}
