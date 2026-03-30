'use client'

import { useState, useEffect, useCallback } from 'react'
import type { GameAction } from '@/lib/engine/types'

const QUEUE_KEY = 'adventure_offline_queue'

interface QueuedAction {
  id: string
  childId: string
  action: GameAction
  timestamp: number
}

function loadQueue(): QueuedAction[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedAction[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function useOfflineQueue() {
  const [isOnline, setIsOnline]   = useState(true)
  const [pending, setPending]     = useState(0)
  const [syncing, setSyncing]     = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    setPending(loadQueue().length)

    const handleOnline  = () => { setIsOnline(true);  flushQueue() }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function flushQueue() {
    const queue = loadQueue()
    if (queue.length === 0) return

    setSyncing(true)
    const failed: QueuedAction[] = []

    for (const item of queue) {
      try {
        const res = await fetch(`/api/progress/${item.childId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: item.action }),
        })
        if (!res.ok) failed.push(item)
      } catch {
        failed.push(item)
      }
    }

    saveQueue(failed)
    setPending(failed.length)
    setSyncing(false)

    // Recargar estado si se sincronizó algo
    if (failed.length < queue.length) {
      window.dispatchEvent(new Event('progress-synced'))
    }
  }

  const enqueue = useCallback((childId: string, action: GameAction) => {
    const queue = loadQueue()
    queue.push({ id: `q_${Date.now()}`, childId, action, timestamp: Date.now() })
    saveQueue(queue)
    setPending(queue.length)
  }, [])

  return { isOnline, pending, syncing, enqueue, flushQueue }
}
