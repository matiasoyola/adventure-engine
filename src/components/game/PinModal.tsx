'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  onSuccess: (adultId: string) => void
  onCancel: () => void
  adults: { id: string; name: string; avatar: string }[]
}

export default function PinModal({ onSuccess, onCancel, adults }: Props) {
  const [selectedAdult, setSelectedAdult] = useState(adults[0]?.id ?? '')
  const [pin, setPin]     = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
                useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => { refs[0].current?.focus() }, [])

  function handleDigit(i: number, val: string) {
    if (!/^\d*$/.test(val)) return
    const next = [...pin]
    next[i] = val.slice(-1)
    setPin(next)
    setError('')
    if (val && i < 3) refs[i + 1].current?.focus()
    if (next.every(d => d !== '') && next[3] !== '') {
      verify(next.join(''), selectedAdult)
    }
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !pin[i] && i > 0) {
      refs[i - 1].current?.focus()
    }
  }

  async function verify(code: string, adultId: string) {
    setLoading(true)
    try {
      const res = await fetch('/api/adults', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adultId, pin: code }),
      })
      if (!res.ok) {
        setError('PIN incorrecto. Inténtalo de nuevo.')
        setPin(['', '', '', ''])
        refs[0].current?.focus()
      } else {
        onSuccess(adultId)
      }
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  function handleOverlay(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div className="drawer-overlay" onClick={handleOverlay}>
      <div className="drawer">
        <div className="drawer-handle" />

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '2rem', marginBottom: 6 }}>🔑</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
            Acceso moderador
          </h3>
          <p style={{ fontSize: '.85rem', color: 'var(--ink-3)', marginTop: 4 }}>
            Introduce tu PIN de 4 dígitos
          </p>
        </div>

        {/* Adult selector */}
        {adults.length > 1 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {adults.map(a => (
              <button key={a.id} onClick={() => { setSelectedAdult(a.id); setPin(['','','','']); setError('') }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 'var(--r-md)',
                  border: `2px solid ${selectedAdult === a.id ? 'var(--purple)' : 'var(--border)'}`,
                  background: selectedAdult === a.id ? 'var(--purple-lt)' : 'var(--bg-muted)',
                  cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: '.85rem', fontWeight: 700,
                  color: selectedAdult === a.id ? 'var(--purple)' : 'var(--ink-2)',
                }}>
                <span>{a.avatar}</span><span>{a.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* PIN inputs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
          {pin.map((d, i) => (
            <input key={i} ref={refs[i]} type="tel" inputMode="numeric" maxLength={1}
              value={d} onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{
                width: 56, height: 64, textAlign: 'center',
                fontSize: d ? '1.8rem' : '1rem',
                fontFamily: 'var(--font-display)', fontWeight: 700,
                border: `2px solid ${error ? 'var(--red)' : d ? 'var(--purple)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)', outline: 'none',
                background: d ? 'var(--purple-lt)' : 'var(--bg)',
                color: d ? 'var(--purple)' : 'var(--ink-3)',
                transition: 'all .15s',
              }}
            />
          ))}
        </div>

        {error && (
          <p style={{ textAlign: 'center', color: 'var(--red)', fontSize: '.85rem', marginBottom: 16 }}>
            {error}
          </p>
        )}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div className="spinner animate-spin" />
          </div>
        )}

        <button className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
