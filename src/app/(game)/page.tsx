'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setChildId, setAdultId } from '@/hooks/useProgress'

interface Adult { id: string; name: string; avatar: string; adventureId: string }
interface Child { id: string; name: string; avatar: string; parentId: string; parentName: string }

const AVATARS = ['🦊','🐻','🦁','🐯','🦋','🐲','🐺','🦅','🐸','🦄','🦒','🐧']
const DEFAULT_ADVENTURE = 'potes-2026'

export default function SelectPage() {
  const router = useRouter()
  const [adults, setAdults]   = useState<Adult[]>([])
  const [kids, setKids]       = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'play'|'setup'>('play')

  // Forms
  const [showAdultForm, setShowAdultForm] = useState(false)
  const [showChildForm, setShowChildForm] = useState(false)
  const [adultName, setAdultName]   = useState('')
  const [adultAvatar, setAdultAvatar] = useState('👨')
  const [adultPin, setAdultPin]     = useState('')
  const [adultPin2, setAdultPin2]   = useState('')
  const [childName, setChildName]   = useState('')
  const [childAvatar, setChildAvatar] = useState(AVATARS[0])
  const [parentId, setParentId]     = useState('')
  const [saving, setSaving]         = useState(false)
  const [formError, setFormError]   = useState('')

  async function load() {
    setLoading(true)
    const [a, k] = await Promise.all([
      fetch('/api/adults').then(r => r.json()),
      fetch('/api/children').then(r => r.json()),
    ])
    setAdults(a); setKids(k)
    if (a.length > 0) setParentId(a[0].id)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function selectChild(child: Child) {
    setChildId(child.id)
    router.push('/map')
  }

  async function createAdult() {
    if (!adultName.trim()) { setFormError('Escribe un nombre'); return }
    if (!/^\d{4}$/.test(adultPin)) { setFormError('El PIN debe ser 4 dígitos'); return }
    if (adultPin !== adultPin2) { setFormError('Los PINs no coinciden'); return }
    setSaving(true); setFormError('')
    const res = await fetch('/api/adults', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: adultName.trim(), avatar: adultAvatar, pin: adultPin, adventureId: DEFAULT_ADVENTURE }),
    })
    if (res.ok) {
      await load(); setShowAdultForm(false); setAdultName(''); setAdultPin(''); setAdultPin2('')
    } else setFormError('Error al crear moderador')
    setSaving(false)
  }

  async function createChild() {
    if (!childName.trim()) { setFormError('Escribe un nombre'); return }
    if (!parentId) { setFormError('Selecciona un moderador'); return }
    setSaving(true); setFormError('')
    const res = await fetch('/api/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: childName.trim(), avatar: childAvatar, parentId }),
    })
    if (res.ok) {
      await load(); setShowChildForm(false); setChildName('')
    } else setFormError('Error al crear explorador')
    setSaving(false)
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* Hero */}
      <div style={{ padding: '36px 20px 24px', background: 'linear-gradient(180deg,#1a1a2e,#16213e)',
        textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage:
          'radial-gradient(1px 1px at 20% 30%,white,transparent),radial-gradient(1px 1px at 70% 15%,white,transparent),radial-gradient(1.5px 1.5px at 50% 60%,white,transparent),radial-gradient(1px 1px at 85% 45%,white,transparent)',
          opacity: .5 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }} className="animate-float">🗺️</div>
          <h1 style={{ color: '#fff', fontSize: '1.7rem' }}>La Gran Aventura</h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.85rem', marginTop: 4 }}>
            Potes · Semana Santa 2026
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1.5px solid var(--border)', background: 'var(--bg)' }}>
        {(['play','setup'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600,
            color: tab === t ? 'var(--ink)' : 'var(--ink-3)',
            borderBottom: `3px solid ${tab === t ? 'var(--amber)' : 'transparent'}`,
            transition: 'all .15s',
          }}>
            {t === 'play' ? '🎮 Jugar' : '⚙️ Configurar'}
          </button>
        ))}
      </div>

      <div className="page" style={{ paddingTop: 20, flex: 1 }}>
        {loading ? (
          <div className="center"><div className="spinner animate-spin" /></div>
        ) : tab === 'play' ? (
          <>
            {/* Kids list */}
            {kids.length === 0 ? (
              <div className="center" style={{ minHeight: '30vh' }}>
                <div style={{ fontSize: '2rem' }}>🧭</div>
                <p style={{ color: 'var(--ink-3)', fontSize: '.9rem', textAlign: 'center' }}>
                  Todavía no hay exploradores.<br/>Ve a Configurar para añadirlos.
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '.8rem', color: 'var(--ink-3)', marginBottom: 12, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  ¿Quién juega hoy?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {kids.map(kid => (
                    <button key={kid.id} onClick={() => selectChild(kid)} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                      borderRadius: 'var(--r-lg)', padding: '14px 16px',
                      cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow)',
                      fontFamily: 'var(--font-body)', width: '100%', transition: 'transform .12s',
                    }}>
                      <span style={{ width: 52, height: 52, borderRadius: '50%',
                        background: 'var(--amber-lt)', border: '2px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.9rem', flexShrink: 0 }}>
                        {kid.avatar}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)' }}>
                          {kid.name}
                        </div>
                        <div style={{ fontSize: '.75rem', color: 'var(--ink-3)', marginTop: 2 }}>
                          Familia de {kid.parentName}
                        </div>
                      </div>
                      <span style={{ color: 'var(--ink-3)', fontSize: '1.2rem' }}>→</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          /* Setup tab */
          <>
            {/* Adults section */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: '.8rem', color: 'var(--ink-3)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Moderadores
                </p>
                <button onClick={() => { setShowAdultForm(true); setShowChildForm(false); setFormError('') }}
                  className="btn btn-ghost" style={{ fontSize: '.8rem', padding: '4px 8px' }}>
                  + Añadir
                </button>
              </div>

              {adults.length === 0 && !showAdultForm && (
                <p style={{ fontSize: '.85rem', color: 'var(--ink-3)', textAlign: 'center', padding: '12px 0' }}>
                  No hay moderadores aún
                </p>
              )}

              {adults.map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', background: 'var(--purple-lt)',
                  borderRadius: 'var(--r-md)', marginBottom: 8, border: '1px solid rgba(108,63,212,.15)' }}>
                  <span style={{ fontSize: '1.4rem' }}>{a.avatar}</span>
                  <span style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--purple)' }}>{a.name}</span>
                  <span className="badge badge-adult" style={{ marginLeft: 'auto' }}>🔑 PIN</span>
                </div>
              ))}

              {showAdultForm && (
                <div className="card" style={{ padding: 16, marginTop: 8 }}>
                  <h3 style={{ marginBottom: 14, fontSize: '1rem' }}>Nuevo moderador</h3>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {['👨','👩','🧑'].map(a => (
                      <button key={a} onClick={() => setAdultAvatar(a)} style={{
                        fontSize: '1.6rem', width: 44, height: 44,
                        background: adultAvatar === a ? 'var(--purple-lt)' : 'var(--bg-muted)',
                        border: `2px solid ${adultAvatar === a ? 'var(--purple)' : 'transparent'}`,
                        borderRadius: 'var(--r-sm)', cursor: 'pointer',
                      }}>{a}</button>
                    ))}
                  </div>
                  {[
                    { val: adultName, set: setAdultName, ph: 'Nombre', type: 'text' },
                    { val: adultPin, set: setAdultPin, ph: 'PIN (4 dígitos)', type: 'tel' },
                    { val: adultPin2, set: setAdultPin2, ph: 'Repetir PIN', type: 'tel' },
                  ].map(({ val, set, ph, type }) => (
                    <input key={ph} type={type} inputMode={type === 'tel' ? 'numeric' : undefined}
                      value={val} onChange={e => set(e.target.value)} placeholder={ph} maxLength={type === 'tel' ? 4 : 20}
                      style={{ width: '100%', padding: '10px 12px', marginBottom: 8, fontSize: '.9rem',
                        fontFamily: 'var(--font-body)', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--r-sm)', outline: 'none', background: 'var(--bg)' }} />
                  ))}
                  {formError && <p style={{ color: 'var(--red)', fontSize: '.8rem', marginBottom: 8 }}>{formError}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }}
                      onClick={() => { setShowAdultForm(false); setFormError('') }}>Cancelar</button>
                    <button className="btn btn-success" style={{ flex: 2, opacity: saving ? .7 : 1 }}
                      onClick={createAdult} disabled={saving}>
                      {saving ? <span className="spinner animate-spin" /> : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Children section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: '.8rem', color: 'var(--ink-3)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  Exploradores
                </p>
                {adults.length > 0 && (
                  <button onClick={() => { setShowChildForm(true); setShowAdultForm(false); setFormError('') }}
                    className="btn btn-ghost" style={{ fontSize: '.8rem', padding: '4px 8px' }}>
                    + Añadir
                  </button>
                )}
              </div>

              {kids.length === 0 && !showChildForm && (
                <p style={{ fontSize: '.85rem', color: 'var(--ink-3)', textAlign: 'center', padding: '12px 0' }}>
                  {adults.length === 0 ? 'Añade un moderador primero' : 'No hay exploradores aún'}
                </p>
              )}

              {kids.map(k => (
                <div key={k.id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', background: 'var(--amber-lt)',
                  borderRadius: 'var(--r-md)', marginBottom: 8, border: '1px solid rgba(232,150,14,.2)' }}>
                  <span style={{ fontSize: '1.4rem' }}>{k.avatar}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--amber-dk)' }}>{k.name}</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--ink-3)' }}>Familia de {k.parentName}</div>
                  </div>
                </div>
              ))}

              {showChildForm && adults.length > 0 && (
                <div className="card" style={{ padding: 16, marginTop: 8 }}>
                  <h3 style={{ marginBottom: 14, fontSize: '1rem' }}>Nuevo explorador</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {AVATARS.map(a => (
                      <button key={a} onClick={() => setChildAvatar(a)} style={{
                        fontSize: '1.4rem', width: 42, height: 42,
                        background: childAvatar === a ? 'var(--amber-lt)' : 'var(--bg-muted)',
                        border: `2px solid ${childAvatar === a ? 'var(--amber)' : 'transparent'}`,
                        borderRadius: 'var(--r-sm)', cursor: 'pointer',
                      }}>{a}</button>
                    ))}
                  </div>
                  <input type="text" value={childName} onChange={e => setChildName(e.target.value)}
                    placeholder="Nombre del explorador" maxLength={20}
                    style={{ width: '100%', padding: '10px 12px', marginBottom: 8, fontSize: '.9rem',
                      fontFamily: 'var(--font-body)', border: '1.5px solid var(--border)',
                      borderRadius: 'var(--r-sm)', outline: 'none', background: 'var(--bg)' }} />
                  {adults.length > 1 && (
                    <select value={parentId} onChange={e => setParentId(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', marginBottom: 8, fontSize: '.9rem',
                        fontFamily: 'var(--font-body)', border: '1.5px solid var(--border)',
                        borderRadius: 'var(--r-sm)', background: 'var(--bg)' }}>
                      {adults.map(a => <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>)}
                    </select>
                  )}
                  {formError && <p style={{ color: 'var(--red)', fontSize: '.8rem', marginBottom: 8 }}>{formError}</p>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" style={{ flex: 1 }}
                      onClick={() => { setShowChildForm(false); setFormError('') }}>Cancelar</button>
                    <button className="btn btn-success" style={{ flex: 2, opacity: saving ? .7 : 1 }}
                      onClick={createChild} disabled={saving}>
                      {saving ? <span className="spinner animate-spin" /> : '¡A la aventura!'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
