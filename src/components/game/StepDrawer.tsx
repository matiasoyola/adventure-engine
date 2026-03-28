'use client'

import { useState } from 'react'
import type { StepView, GameAction } from '@/lib/engine/types'

interface Props {
  step: StepView
  zoneId: string
  clueId: string
  onClose: () => void
  onComplete: (action: GameAction) => Promise<void>
}

export default function StepDrawer({ step, zoneId, clueId, onClose, onComplete }: Props) {
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)

  async function handleComplete() {
    setSaving(true)
    await onComplete({ type: 'complete_step', zoneId, clueId, stepId: step.id })
    setDone(true)
    setSaving(false)
    setTimeout(onClose, 800)
  }

  return (
    <div className="drawer-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="drawer">
        <div className="drawer-handle" />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '.07em', color: 'var(--ink-3)' }}>
            {step.type === 'photo' ? '📷 Foto' : '✅ Misión'}
          </span>
          {step.completed && <span className="badge badge-completed">Completada</span>}
        </div>

        <div style={{ background: 'var(--bg-muted)', borderRadius: 'var(--r-md)',
          padding: '18px', marginBottom: 24 }}>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--ink)',
            fontWeight: 600, margin: 0 }}>
            {step.text}
          </p>
        </div>

        {step.completed ? (
          <div style={{ textAlign: 'center', padding: '12px 0',
            color: 'var(--green)', fontWeight: 700, fontSize: '1.1rem' }}>
            ✓ ¡Ya completada!
          </div>
        ) : done ? (
          <div className="animate-pop" style={{ textAlign: 'center', padding: '12px 0',
            color: 'var(--green)', fontWeight: 700, fontSize: '1.3rem' }}>
            ✓ ¡Bien hecho!
          </div>
        ) : (
          <button className="btn btn-success" onClick={handleComplete}
            disabled={saving} style={{ opacity: saving ? .7 : 1 }}>
            {saving
              ? <span className="spinner animate-spin" />
              : step.type === 'photo'
              ? '📷 Marcar foto hecha'
              : '✓ ¡Misión cumplida!'}
          </button>
        )}
      </div>
    </div>
  )
}
