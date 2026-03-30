'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProgress, getChildId } from '@/hooks/useProgress'
import ProgressBar from '@/components/game/ProgressBar'
import type { ZoneView } from '@/lib/engine/types'

const STATUS_BG: Record<string, string> = {
  locked:      'linear-gradient(135deg,#9e9e9e,#757575)',
  available:   'linear-gradient(135deg,#4a9eff,#1e6fbf)',
  in_progress: 'linear-gradient(135deg,#F5C842,#e8960e)',
  completed:   'linear-gradient(135deg,#4CAF50,#2d7a4f)',
}

const STATUS_GLOW: Record<string, string> = {
  locked:      'none',
  available:   '0 0 18px rgba(74,158,255,.5)',
  in_progress: '0 0 24px rgba(245,200,66,.7)',
  completed:   '0 0 18px rgba(76,175,80,.5)',
}

function ZoneNode({ zone, index }: { zone: ZoneView; index: number }) {
  const isLeft = index % 2 === 0

  const node = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      transition: 'transform .15s', cursor: 'pointer' }}>
      <div style={{
        width: 90, height: 90, borderRadius: '50%',
        background: STATUS_BG[zone.status],
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: '4px solid rgba(255,255,255,.85)',
        boxShadow: `0 5px 0 rgba(0,0,0,.2), ${STATUS_GLOW[zone.status]}`,
        position: 'relative',
        animation: zone.status === 'in_progress' ? 'nodeGlow 2s ease-in-out infinite' : 'none',
      }}>
        <span style={{ fontSize: '2.2rem', lineHeight: 1 }}>{zone.icon}</span>
        {zone.status === 'completed' && (
          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 26, height: 26,
            borderRadius: '50%', background: '#4CAF50', border: '3px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.75rem', color: '#fff', fontWeight: 700 }}>✓</div>
        )}
      </div>

      <div style={{ marginTop: 8, textAlign: 'center', maxWidth: 110 }}>
        <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'rgba(60,40,10,.55)',
          textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'var(--font-body)' }}>
          Día {zone.suggestedOrder}
        </div>
        <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#2a1a05',
          fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
          {zone.name}
        </div>
        <div style={{ fontSize: '.68rem', color: 'rgba(60,40,10,.5)',
          fontFamily: 'var(--font-body)', marginTop: 1 }}>
          {zone.status === 'completed' ? `✓ Completado`
            : zone.status === 'in_progress' ? `▶ ${zone.cluesCompleted}/${zone.cluesTotal} pistas`
            : zone.universe}
        </div>
      </div>
    </div>
  )

  return (
    <Link href={`/zone/${zone.id}`} style={{ textDecoration: 'none' }}>
      {node}
    </Link>
  )
}

function PathDot({ done }: { done: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, margin: '2px 0' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width: done ? 8 : 6, height: done ? 8 : 6, borderRadius: '50%',
          background: done ? '#c8920a' : 'rgba(100,70,20,.25)',
          boxShadow: done ? '0 0 6px rgba(200,146,10,.5)' : 'none',
          transition: 'all .3s',
        }} />
      ))}
    </div>
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
    ? Math.round(gameState.completedZones / gameState.totalZones * 100) : 0

  return (
    <div style={{ minHeight: '100dvh', position: 'relative', overflow: 'hidden' }}>

      <style>{`
        @keyframes nodeGlow {
          0%,100% { box-shadow: 0 5px 0 rgba(0,0,0,.2), 0 0 24px rgba(245,200,66,.7); }
          50%      { box-shadow: 0 5px 0 rgba(0,0,0,.2), 0 0 40px rgba(245,200,66,1); }
        }
        @keyframes cloudDrift {
          0%   { transform: translateX(0); }
          100% { transform: translateX(12px); }
        }
        @keyframes treeSway {
          0%,100% { transform: rotate(-1deg); }
          50%     { transform: rotate(1deg); }
        }
      `}</style>

      {/* ── MAP BACKGROUND — illustrated parchment ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden' }}>

        {/* Parchment base */}
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, #f5e9c8 0%, #eedcaa 30%, #e8d49a 60%, #dfc88a 100%)' }} />

        {/* Texture grain overlay */}
        <div style={{ position: 'absolute', inset: 0, opacity: .08,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px' }} />

        {/* Decorative border */}
        <div style={{ position: 'absolute', inset: 8,
          border: '3px solid rgba(120,80,20,.2)', borderRadius: 12,
          boxShadow: 'inset 0 0 40px rgba(120,80,20,.08)' }} />
        <div style={{ position: 'absolute', inset: 14,
          border: '1px solid rgba(120,80,20,.1)', borderRadius: 8 }} />

        {/* Corner ornaments */}
        {[
          { top: 12, left: 12 },
          { top: 12, right: 12 },
          { bottom: 12, left: 12 },
          { bottom: 12, right: 12 },
        ].map((pos, i) => (
          <div key={i} style={{ position: 'absolute', ...pos,
            width: 24, height: 24, opacity: .35,
            fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ✦
          </div>
        ))}

        {/* Mountains (background) */}
        <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', opacity: .12 }}
          viewBox="0 0 400 120" preserveAspectRatio="none">
          <polygon points="0,120 60,40 120,80 180,20 240,70 300,30 360,60 400,120" fill="#8b6914"/>
          <polygon points="0,120 40,60 100,90 160,35 220,75 280,45 340,70 400,120" fill="#6b4f10" opacity=".6"/>
        </svg>

        {/* Rolling hills */}
        <svg style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%', opacity: .15 }}
          viewBox="0 0 400 60" preserveAspectRatio="none">
          <path d="M0 60 Q50 20 100 40 Q150 55 200 30 Q250 10 300 35 Q350 55 400 25 L400 60 Z" fill="#5a8a2a"/>
        </svg>

        {/* Decorative trees */}
        {[
          { x: 18, y: 160 }, { x: 28, y: 300 }, { x: 340, y: 200 },
          { x: 350, y: 380 }, { x: 15, y: 480 }, { x: 345, y: 520 },
        ].map((pos, i) => (
          <div key={i} style={{ position: 'absolute', left: pos.x, top: pos.y,
            fontSize: '1.6rem', opacity: .4,
            animation: `treeSway ${2.5 + i * 0.3}s ease-in-out infinite alternate`,
            transformOrigin: 'bottom center' }}>
            🌲
          </div>
        ))}

        {/* Clouds */}
        {[
          { left: '10%', top: '8%', size: '1.8rem', delay: '0s' },
          { left: '60%', top: '5%', size: '2.2rem', delay: '1.5s' },
          { left: '35%', top: '12%', size: '1.5rem', delay: '3s' },
        ].map((c, i) => (
          <div key={i} style={{ position: 'absolute', left: c.left, top: c.top,
            fontSize: c.size, opacity: .5,
            animation: `cloudDrift ${6 + i}s ease-in-out infinite alternate`,
            animationDelay: c.delay }}>
            ☁️
          </div>
        ))}

        {/* Compass rose */}
        <div style={{ position: 'absolute', bottom: 24, right: 20,
          fontSize: '2.5rem', opacity: .2, transform: 'rotate(15deg)' }}>
          🧭
        </div>

        {/* Title banner */}
        <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(120,80,20,.12)', border: '1.5px solid rgba(120,80,20,.2)',
          borderRadius: 8, padding: '4px 16px', whiteSpace: 'nowrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '.85rem',
            color: 'rgba(80,50,10,.6)', fontWeight: 600, letterSpacing: '.05em' }}>
            MAPA DE LA AVENTURA
          </span>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(245,233,200,.92)', backdropFilter: 'blur(8px)',
        borderBottom: '1.5px solid rgba(120,80,20,.2)',
        padding: '12px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: '1.4rem' }}>{child.avatar}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600,
              fontSize: '1rem', color: '#2a1a05',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {child.name}
            </div>
            <div style={{ fontSize: '.7rem', color: 'rgba(80,50,10,.6)',
              fontFamily: 'var(--font-body)' }}>
              {gameState.completedZones}/{gameState.totalZones} días · {gameState.badges.length} insignias
            </div>
          </div>
        </div>
        <Link href="/gallery" style={{ marginRight: 8, width: 36, height: 36, borderRadius: '50%', background: 'rgba(120,80,20,.15)', border: '2px solid rgba(120,80,20,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontSize: '1rem' }}>📷</Link>
        <Link href="/profile" style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(120,80,20,.15)', border: '2px solid rgba(120,80,20,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none', fontSize: '1.1rem',
        }}>
          {child.avatar}
        </Link>
      </div>

      {/* ── ZIGZAG MAP ── */}
      <div style={{ position: 'relative', zIndex: 1, padding: '28px 20px 60px' }}>

        {gameState.zones.map((zone, i) => {
          const isLeft = i % 2 === 0
          const prevDone = i > 0 && gameState.zones[i - 1].status === 'completed'

          return (
            <div key={zone.id}>
              {i > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: isLeft ? 'calc(35% - 10px)' : 'calc(65% - 10px)',
                  paddingLeft: isLeft ? '28%' : '0',
                  paddingRight: isLeft ? '0' : '28%',
                  margin: '6px 0',
                }}>
                  <PathDot done={prevDone} />
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: isLeft ? 'flex-start' : 'flex-end',
                paddingLeft: isLeft ? 24 : 0,
                paddingRight: isLeft ? 0 : 24,
              }}>
                <ZoneNode zone={zone} index={i} />
              </div>
            </div>
          )
        })}

        {/* Completion message */}
        {gameState.completedZones === gameState.totalZones && gameState.totalZones > 0 && (
          <div style={{ margin: '32px 0 0', background: 'rgba(45,122,79,.15)',
            border: '2px solid rgba(45,122,79,.3)', borderRadius: 'var(--r-lg)',
            padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 6 }}>🎉</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem',
              fontWeight: 700, color: '#1a4a30' }}>
              ¡Aventura completada!
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
