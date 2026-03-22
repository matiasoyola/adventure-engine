'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProgress, getUserId, clearUserId } from '@/hooks/useProgress'
import ProgressBar from '@/components/game/ProgressBar'

export default function ProfilePage() {
  const router = useRouter()
  const { data, loading } = useProgress()

  useEffect(() => { if (!getUserId()) router.replace('/') }, [router])

  if (loading || !data) return <div className="center" style={{ minHeight: '100dvh' }}><div className="spinner animate-spin" /></div>

  const { user, gameState } = data
  const globalPct = gameState.totalZones > 0
    ? Math.round((gameState.completedZones / gameState.totalZones) * 100) : 0

  return (
    <div>
      <div className="header">
        <Link href="/map" className="btn btn-ghost" style={{ padding: '6px 4px' }}>← Mapa</Link>
        <span className="header-title">Mi perfil</span>
        <div style={{ width: 56 }} />
      </div>

      <div className="page" style={{ paddingTop: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--amber-lt)',
            border: '3px solid var(--amber)', fontSize: '3rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            {user.avatar}
          </div>
          <h1 style={{ fontSize: '1.5rem' }}>{user.name}</h1>
          <p style={{ fontSize: '.85rem', color: 'var(--ink-3)', marginTop: 2 }}>{gameState.adventureTitle}</p>
        </div>

        <div className="card" style={{ padding: '18px', marginBottom: 24 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 14 }}>Progreso global</h2>
          <ProgressBar value={globalPct} label={`${globalPct}% completado`} />
          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 16, textAlign: 'center' }}>
            {[
              { value: gameState.completedZones, label: 'zonas', color: 'var(--green)' },
              { value: gameState.badges.length, label: 'insignias', color: 'var(--amber)' },
              { value: gameState.zones.reduce((a, z) => a + z.stepsCompleted, 0), label: 'pistas', color: 'var(--ink)' },
            ].map((stat, i) => (
              <div key={i}>
                <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '.75rem', color: 'var(--ink-3)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <h2 style={{ fontSize: '1rem', marginBottom: 14, color: 'var(--ink-2)', fontWeight: 700 }}>Insignias</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 }}>
          {gameState.zones.map(zone => (
            <div key={zone.id} className="card" style={{ padding: '16px 12px', textAlign: 'center',
              opacity: zone.badge.unlocked ? 1 : .45,
              borderTop: zone.badge.unlocked ? '3px solid var(--amber)' : undefined }}>
              <div style={{ fontSize: '2.4rem', marginBottom: 6, filter: zone.badge.unlocked ? 'none' : 'grayscale(100%)' }}>
                {zone.badge.icon}
              </div>
              <div style={{ fontSize: '.8rem', fontWeight: 700, color: zone.badge.unlocked ? 'var(--ink)' : 'var(--ink-3)' }}>
                {zone.badge.name}
              </div>
              <div style={{ fontSize: '.7rem', color: 'var(--ink-3)', marginTop: 2 }}>
                {zone.badge.unlocked ? zone.name : '🔒 Sin desbloquear'}
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-secondary" style={{ width: '100%' }}
          onClick={() => { clearUserId(); router.push('/') }}>
          Cambiar de jugador
        </button>
      </div>
    </div>
  )
}
