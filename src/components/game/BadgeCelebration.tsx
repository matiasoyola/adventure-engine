'use client'

import { useRouter } from 'next/navigation'
import type { BadgeContent } from '@/lib/engine/types'

interface Props {
  badge: BadgeContent
  onClose: () => void
}

export default function BadgeCelebration({ badge, onClose }: Props) {
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div style={{
        width: '100%', maxWidth: 480, margin: '0 auto',
        background: 'linear-gradient(180deg, #1a0a2e 0%, #2d1a4a 100%)',
        borderRadius: 'var(--r-xl) var(--r-xl) 0 0',
        padding: '32px 24px 48px',
        animation: 'slideUp .3s ease',
        textAlign: 'center',
      }}
        onClick={e => e.stopPropagation()}
      >
        {/* Stars */}
        <div style={{ fontSize: '1.8rem', letterSpacing: 6, marginBottom: 20 }}>⭐⭐⭐</div>

        {/* Badge icon */}
        <div className="animate-pop" style={{
          width: 120, height: 120, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--gold), #e8960e)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '3.5rem', margin: '0 auto 20px',
          boxShadow: '0 0 60px rgba(245,200,66,.5), 0 6px 0 rgba(0,0,0,.3)',
        }}>
          {badge.icon}
        </div>

        <h2 style={{ color: 'var(--gold)', fontSize: '1.5rem', marginBottom: 10 }}>
          {badge.name}
        </h2>

        <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '.95rem', lineHeight: 1.6,
          fontStyle: 'italic', marginBottom: 20 }}>
          "{badge.completionMessage}"
        </p>

        {badge.nextDayHint && (
          <div style={{
            background: 'rgba(255,255,255,.06)',
            border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 'var(--r-md)', padding: '14px',
            marginBottom: 24,
          }}>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.82rem', lineHeight: 1.5, margin: 0 }}>
              {badge.nextDayHint}
            </p>
          </div>
        )}

        <button className="btn btn-gold" onClick={onClose}>
          ¡Al mapa! 🗺️
        </button>
      </div>
    </div>
  )
}
