'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useProgress, getUserId } from '@/hooks/useProgress'
import StepDrawer from '@/components/game/StepDrawer'
import ProgressBar from '@/components/game/ProgressBar'
import type { StepView, GameAction } from '@/lib/engine/types'

export default function ZonePage() {
  const router  = useRouter()
  const params  = useParams()
  const zoneId  = params.zoneId as string
  const { data, loading, error, dispatch } = useProgress()
  const [activeStep, setActiveStep]       = useState<StepView | null>(null)
  const [justCompleted, setJustCompleted] = useState<string | null>(null)

  useEffect(() => { if (!getUserId()) router.replace('/') }, [router])

  if (loading) return <div className="center" style={{ minHeight: '100dvh' }}><div className="spinner animate-spin" /></div>

  if (error || !data) return (
    <div className="center page" style={{ minHeight: '100dvh' }}>
      <p>{error ?? 'No se pudo cargar la zona'}</p>
      <Link href="/map" className="btn btn-secondary" style={{ marginTop: 8 }}>← Volver al mapa</Link>
    </div>
  )

  const zone = data.gameState.zones.find(z => z.id === zoneId)
  if (!zone) return (
    <div className="center page" style={{ minHeight: '100dvh' }}>
      <p>Zona no encontrada</p>
      <Link href="/map" className="btn btn-secondary" style={{ marginTop: 8 }}>← Volver al mapa</Link>
    </div>
  )

  const pct = zone.stepsTotal > 0 ? Math.round((zone.stepsCompleted / zone.stepsTotal) * 100) : 0

  async function handleAction(action: GameAction) {
    if (action.type === 'complete_step') {
      setJustCompleted(action.stepId)
      setTimeout(() => setJustCompleted(null), 1200)
    }
    await dispatch(action)
  }

  return (
    <div>
      <div className="header">
        <Link href="/map" className="btn btn-ghost" style={{ padding: '6px 4px' }}>← Mapa</Link>
        <span className="header-title" style={{ flex: 1, textAlign: 'center' }}>{zone.icon} {zone.name}</span>
        <div style={{ width: 56 }} />
      </div>

      <div className="page" style={{ paddingTop: 20 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '.85rem', color: 'var(--ink-2)', fontWeight: 600 }}>
              {zone.stepsCompleted} de {zone.stepsTotal} pistas
            </span>
            {zone.status === 'completed' && <span className="badge badge-completed">✓ Zona completada</span>}
            {zone.status === 'in_progress' && <span className="badge badge-progress">En curso</span>}
          </div>
          <ProgressBar value={pct} />
        </div>

        <div style={{ background: 'var(--ink)', color: '#fff', borderRadius: 'var(--r-lg)',
          padding: '20px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -10, right: -10, fontSize: '5rem', opacity: .12, lineHeight: 1 }}>
            {zone.icon}
          </div>
          <p style={{ color: 'rgba(255,255,255,.9)', fontSize: '.95rem', lineHeight: 1.7,
            fontStyle: 'italic', margin: 0, position: 'relative' }}>
            "{zone.narrative}"
          </p>
        </div>

        {zone.badge.unlocked && (
          <div className="animate-pop" style={{ background: 'var(--amber-lt)', border: '2px solid var(--amber)',
            borderRadius: 'var(--r-lg)', padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: '2.2rem' }}>{zone.badge.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#7a5000' }}>¡Insignia conseguida!</div>
              <div style={{ fontSize: '.85rem', color: '#a06800' }}>{zone.badge.name}</div>
            </div>
          </div>
        )}

        <h2 style={{ marginBottom: 14, fontSize: '1rem', color: 'var(--ink-2)', fontWeight: 700 }}>Pistas</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {zone.steps.map((step, idx) => {
            const isNext   = !step.completed && zone.nextStep?.id === step.id
            const isLocked = !step.completed && !isNext && idx > zone.stepsCompleted
            const wasJustDone = justCompleted === step.id

            return (
              <div key={step.id} onClick={() => !isLocked && setActiveStep(step)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                background: step.completed ? 'var(--green-lt)' : isNext ? 'var(--amber-lt)' : 'var(--bg-muted)',
                border: `1.5px solid ${step.completed ? 'var(--green)' : isNext ? 'var(--amber)' : 'transparent'}`,
                borderRadius: 'var(--r-md)', cursor: isLocked ? 'default' : 'pointer',
                opacity: isLocked ? .45 : 1, transition: 'transform .12s',
                transform: wasJustDone ? 'scale(1.01)' : 'scale(1)',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: step.completed ? 'var(--green)' : isNext ? 'var(--amber)' : 'var(--border)',
                  fontSize: '.9rem' }}>
                  {step.completed ? <span style={{ color: '#fff', fontWeight: 700 }}>✓</span>
                    : isLocked ? <span>🔒</span>
                    : step.type === 'photo' ? <span>📷</span>
                    : <span style={{ color: '#fff', fontWeight: 700 }}>{idx + 1}</span>}
                </div>
                <div style={{ flex: 1, minWidth: 0, fontSize: '.9rem',
                  fontWeight: isNext ? 700 : 500, color: isLocked ? 'var(--ink-3)' : 'var(--ink)',
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {isLocked ? 'Completa la pista anterior para desbloquear' : step.text}
                </div>
                {!isLocked && !step.completed && (
                  <span style={{ color: isNext ? 'var(--amber)' : 'var(--ink-3)', fontSize: '1.1rem', flexShrink: 0 }}>→</span>
                )}
              </div>
            )
          })}
        </div>

        {zone.status === 'completed' && (
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <Link href="/map" className="btn btn-primary">← Volver al mapa</Link>
          </div>
        )}
      </div>

      {activeStep && (
        <StepDrawer step={activeStep} zoneId={zoneId} onClose={() => setActiveStep(null)} onComplete={handleAction} />
      )}
    </div>
  )
}
