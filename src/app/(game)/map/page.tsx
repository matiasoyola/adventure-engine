'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProgress, getUserId } from '@/hooks/useProgress'
import ZoneCard from '@/components/game/ZoneCard'
import ProgressBar from '@/components/game/ProgressBar'

export default function MapPage() {
  const router = useRouter()
  const { data, loading, error } = useProgress()

  useEffect(() => { if (!getUserId()) router.replace('/') }, [router])

  if (loading) return (
    <div className="center" style={{ minHeight: '100dvh' }}>
      <div className="spinner animate-spin" />
      <p style={{ color: 'var(--ink-3)' }}>Cargando aventura...</p>
    </div>
  )

  if (error || !data) return (
    <div className="center page" style={{ minHeight: '100dvh' }}>
      <span style={{ fontSize: '2rem' }}>⚠️</span>
      <p>{error ?? 'No se pudo cargar la aventura'}</p>
      <button className="btn btn-secondary" onClick={() => router.replace('/')}>Volver al inicio</button>
    </div>
  )

  const { user, gameState } = data
  const globalPct = gameState.totalZones > 0
    ? Math.round((gameState.completedZones / gameState.totalZones) * 100) : 0

  return (
    <div>
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '1.3rem' }}>🗺️</span>
          <span className="header-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {gameState.adventureTitle}
          </span>
        </div>
        <Link href="/profile" className="header-avatar" title="Mi perfil">{user.avatar}</Link>
      </div>

      <div className="page" style={{ paddingTop: 20 }}>
        <div className="card" style={{ padding: '16px 18px', marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: '1.8rem' }}>{user.avatar}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user.name}</div>
              <div style={{ fontSize: '.8rem', color: 'var(--ink-3)' }}>
                {gameState.completedZones} de {gameState.totalZones} zonas completadas
              </div>
            </div>
            {gameState.badges.length > 0 && (
              <div style={{ marginLeft: 'auto', display: 'flex' }}>
                {gameState.badges.slice(0, 3).map((badgeId, i) => {
                  const zone = gameState.zones.find(z => z.badge.id === badgeId)
                  return zone ? (
                    <span key={badgeId} style={{ fontSize: '1.3rem', marginLeft: i > 0 ? -4 : 0 }}>
                      {zone.badge.icon}
                    </span>
                  ) : null
                })}
              </div>
            )}
          </div>
          <ProgressBar value={globalPct} label={`Progreso global — ${globalPct}%`} />
        </div>

        {gameState.completedZones === gameState.totalZones && gameState.totalZones > 0 && (
          <div style={{ background: 'var(--green)', color: '#fff', borderRadius: 'var(--r-lg)',
            padding: '18px', textAlign: 'center', marginBottom: 22 }}>
            <div style={{ fontSize: '2rem', marginBottom: 6 }}>🎉</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600 }}>
              ¡Aventura completada!
            </div>
          </div>
        )}

        <h2 style={{ marginBottom: 14, fontSize: '1rem', color: 'var(--ink-2)', fontWeight: 700 }}>
          Zonas de la aventura
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {gameState.zones.map(zone => <ZoneCard key={zone.id} zone={zone} />)}
        </div>
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Link href="/profile" style={{ color: 'var(--ink-3)', fontSize: '.85rem', textDecoration: 'none', fontWeight: 600 }}>
            Ver insignias y progreso →
          </Link>
        </div>
      </div>
    </div>
  )
}
