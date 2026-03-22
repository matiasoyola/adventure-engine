'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ProgressResponse, GameAction } from '@/lib/engine/types'

const USER_KEY = 'adventure_user_id'

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(USER_KEY)
}

export function setUserId(id: string) { localStorage.setItem(USER_KEY, id) }
export function clearUserId() { localStorage.removeItem(USER_KEY) }

export function useProgress() {
  const [data, setData]       = useState<ProgressResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch_ = useCallback(async () => {
    const id = getUserId()
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
    const id = getUserId()
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
