'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProgress } from '@/hooks/useProgress'

export default function MorningCardPage() {
  const params  = useParams()
  const router  = useRouter()
  const zoneId  = params.zoneId as string
  const { data, loading } = useProgress()

  if (loading) return <div className="center" style={{ minHeight: '100dvh' }}><div className="spinner animate-spin" /></div>

  const zone = data?.gameState.zones.find(z => z.id === zoneId)
  if (!zone) return (
    <div className="center page">
      <p>Zona no encontrada</p>
      <Link href="/map" className="btn btn-secondary" style={{ marginTop: 8 }}>← Mapa</Link>
    </div>
  )

  const mc = zone.morningCard

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(180deg,#1a0800,#3a1400,#5a2200)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center',
        borderBottom: '1px solid rgba(245,200,66,.2)' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none',
          color: 'rgba(245,200,66,.7)', fontFamily: 'var(--font-body)', fontSize: '.85rem', cursor: 'pointer' }}>
          ← Volver
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-display)',
          color: 'var(--gold)', fontSize: '1rem', fontWeight: 600 }}>
          Carta del Día
        </span>
        <span style={{ background: 'rgba(245,200,66,.15)', border: '1px solid rgba(245,200,66,.3)',
          borderRadius: 99, padding: '2px 8px', fontSize: '.7rem', color: 'var(--gold)',
          fontFamily: 'var(--font-body)' }}>
          🔑 Moderador
        </span>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 40px' }}>

        {/* Day title */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>{zone.icon}</div>
          <h2 style={{ color: 'var(--gold)', fontSize: '1.5rem' }}>{mc.title}</h2>
          <p style={{ color: 'rgba(245,200,66,.6)', fontSize: '.85rem', marginTop: 4 }}>{mc.universe}</p>
        </div>

        {/* Parent guide */}
        <Section label="📍 Guía para padres">
          <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '.85rem', lineHeight: 1.65, margin: 0 }}>
            {mc.parentGuide}
          </p>
        </Section>

        {/* Ritual */}
        <Section label="🎭 Leer en voz alta">
          <p style={{ color: 'var(--gold)', fontSize: '.9rem', lineHeight: 1.7,
            fontStyle: 'italic', margin: 0 }}>
            "{mc.ritual}"
          </p>
        </Section>

        {/* Watch for */}
        <Section label="👀 En qué fijarse antes de llegar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mc.watchFor.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(255,255,255,.04)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                <span style={{ color: 'var(--gold)', flexShrink: 0 }}>→</span>
                <span style={{ color: 'rgba(255,255,255,.75)', fontSize: '.83rem',
                  lineHeight: 1.4, fontFamily: 'var(--font-body)' }}>{item}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Clue schedule */}
        <Section label="⏰ Cuándo abrir cada pista">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mc.clueSchedule.map((cs, i) => {
              const clue = zone.clues.find(c => c.id === cs.clueId)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: 'rgba(255,255,255,.04)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
                  <span style={{ color: zone.icon, flexShrink: 0, fontSize: '1rem' }}>{zone.icon}</span>
                  <div style={{ fontFamily: 'var(--font-body)' }}>
                    <div style={{ fontWeight: 700, fontSize: '.82rem', color: 'rgba(144,238,144,.9)' }}>
                      {clue?.title ?? `Pista ${i + 1}`}
                    </div>
                    <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.55)', marginTop: 2 }}>
                      {cs.trigger}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

      </div>

      {/* CTA */}
      <div style={{ padding: '0 20px 40px' }}>
        <button className="btn btn-gold" onClick={() => router.back()}>
          ¡Que empiece la aventura! {zone.icon}
        </button>
      </div>
    </div>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'rgba(245,200,66,.5)',
        textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--font-body)', marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(245,200,66,.12)',
        borderRadius: 'var(--r-md)', padding: '14px' }}>
        {children}
      </div>
    </div>
  )
}
