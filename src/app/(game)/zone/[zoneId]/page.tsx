'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useProgress, getChildId } from '@/hooks/useProgress'
import StepDrawer from '@/components/game/StepDrawer'
import BadgeCelebration from '@/components/game/BadgeCelebration'
import ProgressBar from '@/components/game/ProgressBar'
import PinModal from '@/components/game/PinModal'
import SpeakButton from '@/components/ui/SpeakButton'
import OfflineBanner from '@/components/ui/OfflineBanner'
import type { StepView, GameAction, ClueView } from '@/lib/engine/types'

interface Adult { id: string; name: string; avatar: string }

const CLUE_STATUS_LABEL: Record<string, string> = {
  locked: 'Bloqueada', available: 'Disponible', in_progress: 'En curso', completed: 'Completada',
}
const CLUE_STATUS_CLASS: Record<string, string> = {
  locked: 'badge-locked', available: 'badge-available',
  in_progress: 'badge-progress', completed: 'badge-completed',
}

function ClueCard({ clue, zoneId, onStepPress, isExpanded, onToggle }:
  { clue: ClueView; zoneId: string; onStepPress: (step: StepView, clueId: string) => void;
    isExpanded: boolean; onToggle: () => void }) {

  const isInteractive = clue.status !== 'locked'
  const pct = clue.stepsTotal > 0 ? Math.round(clue.stepsCompleted / clue.stepsTotal * 100) : 0

  const bgColor = clue.status === 'completed' ? '#f0faf4'
    : clue.status === 'in_progress' ? '#fffcf0'
    : clue.status === 'available' ? '#f0f6ff'
    : 'var(--bg-muted)'

  const borderColor = clue.status === 'completed' ? 'var(--green)'
    : clue.status === 'in_progress' ? 'var(--amber)'
    : clue.status === 'available' ? 'var(--blue)'
    : 'var(--border)'

  return (
    <div style={{ borderRadius: 'var(--r-lg)', overflow: 'hidden',
      border: `1.5px solid ${borderColor}`, boxShadow: 'var(--shadow)',
      opacity: clue.status === 'locked' ? .55 : 1 }}>

      <div onClick={isInteractive ? onToggle : undefined}
        style={{ padding: '14px 16px', background: bgColor,
          cursor: isInteractive ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: clue.status === 'completed' ? 'var(--green)'
            : clue.status === 'in_progress' ? 'var(--amber)'
            : clue.status === 'available' ? 'var(--blue)'
            : 'var(--border)',
          color: clue.status === 'locked' ? 'var(--ink-3)' : '#fff',
          fontSize: clue.status === 'locked' ? '.9rem' : '.95rem', fontWeight: 700,
        }}>
          {clue.status === 'locked' ? '🔒' : clue.status === 'completed' ? '✓' : clue.order}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--ink)',
            fontFamily: 'var(--font-display)' }}>{clue.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
            <span className={`badge ${CLUE_STATUS_CLASS[clue.status]}`}>
              {CLUE_STATUS_LABEL[clue.status]}
            </span>
            {clue.status !== 'locked' && (
              <span style={{ fontSize: '.72rem', color: 'var(--ink-3)', fontFamily: 'var(--font-body)' }}>
                {clue.stepsCompleted}/{clue.stepsTotal} actividades
              </span>
            )}
          </div>
        </div>
        {isInteractive && (
          <span style={{ color: 'var(--ink-3)', fontSize: '1rem', transition: 'transform .2s',
            transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▼</span>
        )}
      </div>

      {clue.status === 'in_progress' && (
        <div style={{ padding: '0 16px 8px', background: bgColor }}>
          <ProgressBar value={pct} />
        </div>
      )}

      {isExpanded && isInteractive && (
        <div style={{ background: 'var(--bg-card)', borderTop: `1px solid ${borderColor}` }}>

          {/* Narrative with TTS */}
          <div style={{ padding: '14px 16px',
            background: clue.status === 'completed' ? 'var(--green-lt)' : 'var(--bg-muted)',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <p style={{ fontSize: '.85rem', lineHeight: 1.65, color: 'var(--ink-2)',
              fontStyle: 'italic', margin: 0, flex: 1 }}>
              "{clue.narrative}"
            </p>
            <SpeakButton text={clue.narrative} />
          </div>

          {/* Steps with TTS */}
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {clue.steps.map((step, si) => {
              const isNextStep = !step.completed && si === clue.steps.findIndex(s => !s.completed)
              const isLocked = !step.completed && !isNextStep

              return (
                <div key={step.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 12px', borderRadius: 'var(--r-sm)',
                    background: step.completed ? 'var(--green-lt)'
                      : isNextStep ? 'var(--amber-lt)' : 'var(--bg-muted)',
                    border: `1px solid ${step.completed ? 'var(--green)'
                      : isNextStep ? 'var(--amber)' : 'transparent'}`,
                    opacity: isLocked ? .5 : 1,
                  }}>
                  <div onClick={() => !isLocked && onStepPress(step, clue.id)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                      flex: 1, cursor: isLocked ? 'default' : 'pointer' }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: step.completed ? 'var(--green)'
                        : isNextStep ? 'var(--amber)' : 'var(--border)',
                      fontSize: '.72rem', color: isLocked ? 'var(--ink-3)' : '#fff', fontWeight: 700,
                    }}>
                      {step.completed ? '✓' : isLocked ? '🔒' : step.type === 'photo' ? '📷' : si + 1}
                    </div>
                    <span style={{ fontSize: '.83rem', lineHeight: 1.5,
                      color: isLocked ? 'var(--ink-3)' : 'var(--ink)',
                      textDecoration: step.completed ? 'line-through' : 'none',
                      fontFamily: 'var(--font-body)', flex: 1 }}>
                      {step.text}
                    </span>
                    {!isLocked && !step.completed && (
                      <span style={{ color: isNextStep ? 'var(--amber)' : 'var(--ink-3)',
                        fontSize: '1rem', flexShrink: 0 }}>→</span>
                    )}
                  </div>
                  {/* TTS button for each step */}
                  {!isLocked && <SpeakButton text={step.text} />}
                </div>
              )
            })}
          </div>

          {clue.status === 'completed' && (
            <div style={{ margin: '0 14px 14px', padding: '12px',
              background: 'var(--green-lt)', borderRadius: 'var(--r-md)',
              border: '1px solid var(--green)' }}>
              <p style={{ fontSize: '.8rem', color: 'var(--green-dk)',
                fontStyle: 'italic', margin: 0, lineHeight: 1.5 }}>
                {clue.completionMessage}
              </p>
              {clue.nextClueHint && (
                <p style={{ fontSize: '.75rem', color: 'var(--ink-3)',
                  margin: '6px 0 0', fontWeight: 600 }}>
                  → {clue.nextClueHint}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ZonePage() {
  const router = useRouter()
  const params = useParams()
  const zoneId = params.zoneId as string

  const { data, loading, error, dispatch, isOnline, pending, syncing } = useProgress()
  const [activeStep, setActiveStep]     = useState<StepView | null>(null)
  const [activeClueId, setActiveClueId] = useState<string | null>(null)
  const [expandedClue, setExpandedClue] = useState<string | null>(null)
  const [showBadge, setShowBadge]       = useState(false)
  const [showPin, setShowPin]           = useState(false)
  const [adults, setAdults]             = useState<Adult[]>([])
  const prevBadgesRef                   = useRef<string[]>([])

  useEffect(() => { if (!getChildId()) router.replace('/') }, [router])
  useEffect(() => {
    fetch('/api/adults').then(r => r.json()).then(setAdults).catch(() => {})
  }, [])
  useEffect(() => {
    if (!data) return
    const zone = data.gameState.zones.find(z => z.id === zoneId)
    if (!zone) return
    const first = zone.clues.find(c => c.status !== 'locked')
    if (first) setExpandedClue(prev => prev ?? first.id)
  }, [data, zoneId])
  useEffect(() => {
    if (!data) return
    const currentBadges = data.gameState.badges
    const prev = prevBadgesRef.current
    if (prev.length > 0 && currentBadges.some(b => !prev.includes(b))) setShowBadge(true)
    prevBadgesRef.current = currentBadges
  }, [data])

  if (loading) return <div className="center" style={{ minHeight: '100dvh' }}><div className="spinner animate-spin" /></div>
  if (error || !data) return (
    <div className="center page">
      <p>{error ?? 'Error'}</p>
      <Link href="/map" className="btn btn-secondary" style={{ marginTop: 8 }}>← Mapa</Link>
    </div>
  )

  const zone = data.gameState.zones.find(z => z.id === zoneId)
  if (!zone) return (
    <div className="center page">
      <p>Zona no encontrada</p>
      <Link href="/map" className="btn btn-secondary" style={{ marginTop: 8 }}>← Mapa</Link>
    </div>
  )

  const cluesPct = zone.cluesTotal > 0
    ? Math.round(zone.cluesCompleted / zone.cluesTotal * 100) : 0

  async function handleAction(action: GameAction) {
    prevBadgesRef.current = data!.gameState.badges.slice()
    await dispatch(action)
  }

  return (
    <div>
      <OfflineBanner isOnline={isOnline} pending={pending} syncing={syncing} />

      <div className="header">
        <Link href="/map" className="btn btn-ghost" style={{ padding: '6px 4px' }}>← Mapa</Link>
        <span className="header-title" style={{ flex: 1, textAlign: 'center', overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {zone.icon} {zone.name}
        </span>
        <div style={{ width: 56 }} />
      </div>

      <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
        padding: '16px 16px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -8, top: -8, fontSize: '6rem',
          opacity: .1, lineHeight: 1 }}>{zone.icon}</div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: '.72rem', fontWeight: 700, color: 'rgba(255,255,255,.5)',
              textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'var(--font-body)' }}>
              {zone.universe}
            </span>
            {zone.status === 'completed' && (
              <span className="badge badge-completed">✓ Completado</span>
            )}
            {!isOnline && (
              <span style={{ fontSize: '.7rem', background: 'rgba(255,255,255,.1)',
                color: 'rgba(255,255,255,.6)', padding: '2px 8px', borderRadius: 99,
                fontFamily: 'var(--font-body)' }}>
                📡 Sin conexión
              </span>
            )}
          </div>
          <ProgressBar value={cluesPct}
            label={`${zone.cluesCompleted}/${zone.cluesTotal} pistas completadas`} />
        </div>
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        <button onClick={() => setShowPin(true)} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
          background: 'linear-gradient(135deg, var(--gold), #e8960e)',
          border: 'none', borderRadius: 'var(--r-md)', padding: '12px 16px',
          cursor: 'pointer', boxShadow: '0 3px 0 #b8920a',
          fontFamily: 'var(--font-body)', textAlign: 'left',
        }}>
          <span style={{ fontSize: '1.4rem' }}>🌅</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--gold-dk)' }}>
              Carta del Día
            </div>
            <div style={{ fontSize: '.75rem', color: 'rgba(58,32,0,.6)' }}>
              Solo moderadores · {zone.morningCard.universe}
            </div>
          </div>
          <span style={{ color: 'var(--gold-dk)', fontSize: '1rem' }}>🔑</span>
        </button>
      </div>

      <div className="page" style={{ paddingTop: 16 }}>
        {zone.badge.unlocked && (
          <div className="animate-pop" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'var(--amber-lt)', border: '2px solid var(--amber)',
            borderRadius: 'var(--r-md)', padding: '14px 16px', marginBottom: 16,
          }}>
            <span style={{ fontSize: '2rem' }}>{zone.badge.icon}</span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--amber-dk)' }}>¡Insignia desbloqueada!</div>
              <div style={{ fontSize: '.82rem', color: 'var(--ink-3)' }}>{zone.badge.name}</div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {zone.clues.map(clue => (
            <ClueCard key={clue.id} clue={clue} zoneId={zoneId}
              isExpanded={expandedClue === clue.id}
              onToggle={() => setExpandedClue(expandedClue === clue.id ? null : clue.id)}
              onStepPress={(step, clueId) => { setActiveStep(step); setActiveClueId(clueId) }} />
          ))}
        </div>

        {zone.status === 'completed' && (
          <div style={{ marginTop: 24 }}>
            <Link href="/map" className="btn btn-primary">← Volver al mapa</Link>
          </div>
        )}
      </div>

      {activeStep && activeClueId && (
        <StepDrawer step={activeStep} zoneId={zoneId} clueId={activeClueId}
          childId={data.child.id} adventureId={data.gameState.adventureId}
          onClose={() => { setActiveStep(null); setActiveClueId(null) }}
          onComplete={handleAction} />
      )}

      {showBadge && (
        <BadgeCelebration badge={zone.badge}
          onClose={() => { setShowBadge(false); router.push('/map') }} />
      )}

      {showPin && adults.length > 0 && (
        <PinModal adults={adults}
          onSuccess={() => { setShowPin(false); router.push(`/morning/${zoneId}`) }}
          onCancel={() => setShowPin(false)} />
      )}
    </div>
  )
}
