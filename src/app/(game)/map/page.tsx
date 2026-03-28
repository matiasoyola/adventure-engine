'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProgress, getChildId } from '@/hooks/useProgress'
import ProgressBar from '@/components/game/ProgressBar'
import type { ZoneView } from '@/lib/engine/types'

const STATUS_COLOR: Record<string, string> = {
  locked:      'linear-gradient(135deg,#9e9e9e,#757575)',
  available:   'linear-gradient(135deg,#4a9eff,#1e6fbf)',
  in_progress: 'linear-gradient(135deg,#F5C842,#e8960e)',
  completed:   'linear-gradient(135deg,#4CAF50,#2d7a4f)',
}

const STATUS_SHADOW: Record<string, string> = {
  locked:      'none',
  available:   '0 0 20px rgba(74,158,255,.4)',
  in_progress: '0 0 24px rgba(245,200,66,.6)',
  completed:   '0 0 20px rgba(76,175,80,.4)',
}

function ZoneNode({ zone, index }: { zone: ZoneView; index: number }) {
  const isLeft = index % 2 === 0
  const isClickable = zone.status !== 'locked'

  const node = (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      cursor: isClickable ? 'pointer' : 'default',
      transition: 'transform .15s',
    }}>
      {/* Circle */}
      <div style={{
        width: 86, height: 86, borderRadius: '50%',
        background: STATUS_COLOR[zone.status],
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: '4px solid rgba(255,255,255,.7)',
        boxShadow: `0 4px 0 rgba(0,0,0,.2), ${STATUS_SHADOW[zone.status]}`,
        position: 'relative',
        animation: zone.status === 'in_progress' ? 'pulse 2s ease-in-out infinite' : 'none',
      }}>
        <span style={{ fontSize: '2rem', lineHeight: 1 }}>{zone.icon}</span>
        {zone.status === 'completed' && (
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            width: 26, height: 26, borderRadius: '50%',
            background: '#4CAF50', border: '3px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.8rem', color: '#fff', fontWeight: 700,
          }}>✓</div>
        )}
        {zone.status === 'locked' && (
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            width: 26, height: 26, borderRadius: '50%',
            background: '#757575', border: '3px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.7rem',
          }}>🔒</div>
        )}
      </div>

      {/* Label */}
      <div style={{ marginTop: 8, textAlign: 'center', maxWidth: 100 }}>
        <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--ink-3)',
          textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--font-body)' }}>
          Día {zone.suggestedOrder}
        </div>
        <div style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>
          {zone.name}
        </div>
        <div style={{ fontSize: '.7rem', color: 'var(--ink-3)', fontFamily: 'var(--font-body)' }}>
          {zone.status === 'locked' ? '🔒 Bloqueado'
            : zone.status === 'completed' ? `✓ ${zone.cluesCompleted}/${zone.cluesTotal} pistas`
            : zone.status === 'in_progress' ? `▶ ${zone.cluesCompleted}/${zone.cluesTotal} pistas`
            : '● Disponible'}
        </div>
      </div>
    </div>
  )

  return isClickable
    ? <Link href={`/zone/${zone.id}`} style={{ textDecoration: 'none' }}>{node}</Link>
    : node
}

function Connector({ done }: { done: boolean }) {
  return (
    <div style={{
      width: 6, height: 44, borderRadius: 3, margin: '2px auto',
      background: done ? 'var(--gold)' : 'rgba(0,0,0,.12)',
      boxShadow: done ? '0 0 8px rgba(245,200,66,.5)' : 'none',
    }} />
  )
}

export default function MapPage() {
  const router = useRouter()
  const { data, loading, error } = useProgress()

  useEffect(() => { if (!getChildId()) router.replace('/') }, [router])

  if (loading) return (
    <div className="center" style={{ minHeight: '100dvh' }}>
      <div className="spinner animate-spin" />
    </div>
  )

  if (error || !data) return (
    <div className="center page" style={{ minHeight: '100dvh' }}>
      <span style={{ fontSize: '2rem' }}>⚠️</span>
      <p>{error ?? 'No se pudo cargar'}</p>
      <button className="btn btn-secondary" onClick={() => router.replace('/')}>Volver</button>
    </div>
  )

  const { child, gameState } = data
  const globalPct = gameState.totalZones > 0
    ? Math.round((gameState.completedZones / gameState.totalZones) * 100) : 0

  return (
    <div>
      {/* Header */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '1.3rem' }}>🗺️</span>
          <span className="header-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {gameState.adventureTitle}
          </span>
        </div>
        <Link href="/profile" className="header-avatar">{child.avatar}</Link>
      </div>

      {/* Sky background map area */}
      <div style={{
        background: 'linear-gradient(180deg, #87CEEB 0%, #b8e4f0 35%, #c8eedb 65%, #a8d8a8 100%)',
        minHeight: 'calc(100dvh - 65px)',
        paddingBottom: 40,
      }}>

        {/* Player card */}
        <div style={{ padding: '16px 16px 0' }}>
          <div style={{
            background: 'rgba(255,255,255,.7)', backdropFilter: 'blur(10px)',
            borderRadius: 'var(--r-lg)', padding: '12px 14px',
            border: '1px solid rgba(255,255,255,.8)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: '1.6rem' }}>{child.avatar}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--ink)' }}>{child.name}</div>
              <ProgressBar value={globalPct} label={`${gameState.completedZones}/${gameState.totalZones} días completados`} />
            </div>
            {gameState.badges.length > 0 && (
              <div style={{ display: 'flex' }}>
                {gameState.badges.slice(0, 3).map((bid, i) => {
                  const z = gameState.zones.find(z => z.badge.id === bid)
                  return z ? <span key={bid} style={{ fontSize: '1.1rem', marginLeft: i > 0 ? -4 : 0 }}>{z.badge.icon}</span> : null
                })}
              </div>
            )}
          </div>
        </div>

        {/* Zigzag map */}
        <div style={{ padding: '24px 20px 0' }}>
          <style>{`@keyframes pulse{0%,100%{box-shadow:0 4px 0 rgba(0,0,0,.2),0 0 24px rgba(245,200,66,.6)}50%{box-shadow:0 4px 0 rgba(0,0,0,.2),0 0 40px rgba(245,200,66,.9)}}`}</style>

          {gameState.zones.map((zone, i) => {
            const isLeft = i % 2 === 0
            const prevCompleted = i === 0 ? false : gameState.zones[i-1].status === 'completed'

            return (
              <div key={zone.id}>
                {/* Connector */}
                {i > 0 && (
                  <div style={{ display: 'flex', justifyContent: isLeft ? '65%' : '35%' }}>
                    <Connector done={prevCompleted} />
                  </div>
                )}

                {/* Node row with zigzag */}
                <div style={{
                  display: 'flex',
                  justifyContent: isLeft ? 'flex-start' : 'flex-end',
                  paddingLeft: isLeft ? 40 : 0,
                  paddingRight: isLeft ? 0 : 40,
                }}>
                  <ZoneNode zone={zone} index={i} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Completion banner */}
        {gameState.completedZones === gameState.totalZones && gameState.totalZones > 0 && (
          <div style={{ margin: '32px 16px 0', background: 'var(--green)', borderRadius: 'var(--r-lg)',
            padding: '20px', textAlign: 'center', boxShadow: '0 4px 0 #1a4a30' }}>
            <div style={{ fontSize: '2rem', marginBottom: 6 }}>🎉</div>
            <h2 style={{ color: '#fff', fontSize: '1.3rem' }}>¡Aventura completada!</h2>
            <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '.85rem', marginTop: 4 }}>
              Habéis completado los {gameState.totalZones} días
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
