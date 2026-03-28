'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProgress, getChildId, clearChildId } from '@/hooks/useProgress'
import ProgressBar from '@/components/game/ProgressBar'

export default function ProfilePage() {
  const router = useRouter()
  const { data, loading } = useProgress()

  useEffect(() => { if (!getChildId()) router.replace('/') }, [router])

  if (loading || !data) return <div className="center" style={{ minHeight: '100dvh' }}><div className="spinner animate-spin" /></div>

  const { child, gameState } = data
  const globalPct = gameState.totalZones > 0
    ? Math.round(gameState.completedZones / gameState.totalZones * 100) : 0
  const totalSteps = gameState.zones.reduce((a, z) =>
    a + z.clues.reduce((b, c) => b + c.stepsCompleted, 0), 0)
  const totalClues = gameState.zones.reduce((a, z) => a + z.cluesCompleted, 0)

  return (
    <div>
      <div className="header">
        <Link href="/map" className="btn btn-ghost" style={{ padding: '6px 4px' }}>← Mapa</Link>
        <span className="header-title">Mi perfil</span>
        <div style={{ width: 56 }} />
      </div>

      <div className="page" style={{ paddingTop: 24 }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%',
            background: 'var(--amber-lt)', border: '3px solid var(--amber)',
            fontSize: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px' }}>
            {child.avatar}
          </div>
          <h1 style={{ fontSize: '1.5rem' }}>{child.name}</h1>
          <p style={{ fontSize: '.82rem', color: 'var(--ink-3)', marginTop: 2 }}>
            {gameState.adventureTitle}
          </p>
        </div>

        {/* Stats */}
        <div className="card" style={{ padding: '18px', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 14 }}>Progreso de la aventura</h2>
          <ProgressBar value={globalPct} label={`${globalPct}% completado`} />
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16, textAlign: 'center' }}>
            {[
              { v: gameState.completedZones, l: 'días', c: 'var(--green)' },
              { v: totalClues, l: 'pistas', c: 'var(--amber)' },
              { v: totalSteps, l: 'actividades', c: 'var(--blue)' },
              { v: gameState.badges.length, l: 'insignias', c: 'var(--purple)' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: s.c }}>
                  {s.v}
                </div>
                <div style={{ fontSize: '.72rem', color: 'var(--ink-3)', fontFamily: 'var(--font-body)' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        <h2 style={{ fontSize: '1rem', marginBottom: 12, color: 'var(--ink-2)', fontWeight: 700 }}>
          Insignias
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {gameState.zones.map(zone => (
            <div key={zone.id} className="card" style={{
              padding: '14px 12px', textAlign: 'center',
              opacity: zone.badge.unlocked ? 1 : .4,
              borderTop: zone.badge.unlocked ? '3px solid var(--gold)' : undefined,
            }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 6,
                filter: zone.badge.unlocked ? 'none' : 'grayscale(1)' }}>
                {zone.badge.icon}
              </div>
              <div style={{ fontSize: '.78rem', fontWeight: 700,
                color: zone.badge.unlocked ? 'var(--ink)' : 'var(--ink-3)', lineHeight: 1.3 }}>
                {zone.badge.name}
              </div>
              <div style={{ fontSize: '.68rem', color: 'var(--ink-3)', marginTop: 3,
                fontFamily: 'var(--font-body)' }}>
                {zone.badge.unlocked ? zone.name : `🔒 ${zone.name}`}
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-secondary" style={{ width: '100%' }}
          onClick={() => { clearChildId(); router.push('/') }}>
          Cambiar de explorador
        </button>
      </div>
    </div>
  )
}
