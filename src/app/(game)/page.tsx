'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setUserId } from '@/hooks/useProgress'

interface User { id: string; name: string; avatar: string }

const AVATARS = ['🦊', '🐻', '🦁', '🐯', '🦋', '🐲', '🐺', '🦅', '🐸', '🦄']
const DEFAULT_ADVENTURE = 'picos-2026'

export default function SelectUserPage() {
  const router = useRouter()
  const [users, setUsers]       = useState<User[]>([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName]         = useState('')
  const [avatar, setAvatar]     = useState(AVATARS[0])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function selectUser(user: User) { setUserId(user.id); router.push('/map') }

  async function createUser() {
    if (!name.trim()) { setError('Escribe un nombre'); return }
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), avatar, adventureId: DEFAULT_ADVENTURE }),
      })
      if (!res.ok) throw new Error()
      const user = await res.json() as User
      setUserId(user.id)
      router.push('/map')
    } catch {
      setError('No se pudo crear el jugador. Inténtalo de nuevo.')
      setSaving(false)
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '32px 20px 20px', background: 'var(--ink)', color: '#fff', textAlign: 'center' }}>
        <div style={{ fontSize: '2.8rem', marginBottom: 8 }}>🗺️</div>
        <h1 style={{ color: '#fff', fontSize: '1.8rem' }}>Aventura Familiar</h1>
        <p style={{ color: 'rgba(255,255,255,.65)', marginTop: 6, fontSize: '.95rem' }}>
          ¿Quién va a jugar hoy?
        </p>
      </div>

      <div className="page" style={{ paddingTop: 24, flex: 1 }}>
        {loading ? (
          <div className="center"><div className="spinner animate-spin" /></div>
        ) : (
          <>
            {users.length > 0 && !creating && (
              <div style={{ marginBottom: 28 }}>
                <h2 style={{ marginBottom: 14, fontSize: '1rem', color: 'var(--ink-2)' }}>Jugadores guardados</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {users.map(u => (
                    <button key={u.id} onClick={() => selectUser(u)} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                      borderRadius: 'var(--r-lg)', padding: '14px 16px',
                      cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow)',
                      fontFamily: 'var(--font-body)', width: '100%',
                    }}>
                      <span style={{ fontSize: '2.2rem', width: 50, height: 50,
                        background: 'var(--amber-lt)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {u.avatar}
                      </span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--ink)' }}>{u.name}</span>
                      <span style={{ marginLeft: 'auto', color: 'var(--ink-3)', fontSize: '1.3rem' }}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!creating ? (
              <button className="btn btn-primary" onClick={() => setCreating(true)} style={{ gap: 8 }}>
                <span style={{ fontSize: '1.2rem' }}>+</span>
                {users.length === 0 ? 'Crear primer jugador' : 'Añadir jugador'}
              </button>
            ) : (
              <div className="card" style={{ padding: 20 }}>
                <h2 style={{ marginBottom: 20, fontSize: '1.15rem' }}>Nuevo jugador</h2>
                <label style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>
                  Elige tu avatar
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {AVATARS.map(a => (
                    <button key={a} onClick={() => setAvatar(a)} style={{
                      fontSize: '1.6rem', width: 48, height: 48,
                      background: avatar === a ? 'var(--amber-lt)' : 'var(--bg-muted)',
                      border: `2px solid ${avatar === a ? 'var(--amber)' : 'transparent'}`,
                      borderRadius: 'var(--r-sm)', cursor: 'pointer', transition: 'all .15s',
                    }}>{a}</button>
                  ))}
                </div>
                <label style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--ink-2)', display: 'block', marginBottom: 8 }}>
                  Nombre del explorador
                </label>
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && createUser()}
                  placeholder="Ej: Mateo, Sofía..." maxLength={20} autoFocus
                  style={{ width: '100%', padding: '12px 14px', fontSize: '1rem',
                    fontFamily: 'var(--font-body)', border: '1.5px solid var(--border)',
                    borderRadius: 'var(--r-md)', outline: 'none',
                    background: 'var(--bg)', color: 'var(--ink)', marginBottom: 16 }} />
                {error && <p style={{ color: 'var(--red)', fontSize: '.85rem', marginBottom: 12 }}>{error}</p>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" style={{ flex: 1 }}
                    onClick={() => { setCreating(false); setName(''); setError('') }}>
                    Cancelar
                  </button>
                  <button className="btn btn-success" onClick={createUser}
                    disabled={saving} style={{ flex: 2, opacity: saving ? .7 : 1 }}>
                    {saving ? <span className="spinner animate-spin" /> : '¡A la aventura! 🗺️'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
