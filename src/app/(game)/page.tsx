'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setChildId } from '@/hooks/useProgress'

interface Adult { id: string; name: string; avatar: string; adventureId: string }
interface Child {
  id: string; name: string; avatar: string; parentId: string; parentName: string
  completedZones?: number; totalZones?: number; badges?: string[]
}

const AVATARS = ['🦊','🐻','🦁','🐯','🦋','🐲','🐺','🦅','🐸','🦄','🦒','🐧']
const ADULT_AVATARS = ['👨','👩','🧑','👴','👵','🧔']
const DEFAULT_ADVENTURE = 'potes-2026'

type EditingAdult = { id: string; name: string; avatar: string; pin: string; pin2: string }
type EditingChild = { id: string; name: string; avatar: string }

export default function SelectPage() {
  const router = useRouter()
  const [adults, setAdults]   = useState<Adult[]>([])
  const [kids, setKids]       = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'play'|'setup'>('play')
  const [currentDay, setCurrentDay] = useState<string>('')

  const [showAdultForm, setShowAdultForm] = useState(false)
  const [showChildForm, setShowChildForm] = useState(false)
  const [editAdult, setEditAdult]         = useState<EditingAdult | null>(null)
  const [editChild, setEditChild]         = useState<EditingChild | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{type:'adult'|'child';id:string;name:string}|null>(null)

  const [adultName, setAdultName]     = useState('')
  const [adultAvatar, setAdultAvatar] = useState('👨')
  const [adultPin, setAdultPin]       = useState('')
  const [adultPin2, setAdultPin2]     = useState('')
  const [childName, setChildName]     = useState('')
  const [childAvatar, setChildAvatar] = useState(AVATARS[0])
  const [parentId, setParentId]       = useState('')
  const [saving, setSaving]           = useState(false)
  const [formError, setFormError]     = useState('')

  async function load() {
    setLoading(true)
    const [a, k] = await Promise.all([
      fetch('/api/adults').then(r => r.json()),
      fetch('/api/children').then(r => r.json()),
    ])
    setAdults(a); setParentId(a[0]?.id ?? '')

    // Load progress for each child
    const kidsWithProgress = await Promise.all(
      k.map(async (kid: Child) => {
        try {
          const res = await fetch(`/api/progress/${kid.id}`)
          if (!res.ok) return kid
          const data = await res.json()
          return {
            ...kid,
            completedZones: data.gameState.completedZones,
            totalZones: data.gameState.totalZones,
            badges: data.gameState.badges,
          }
        } catch { return kid }
      })
    )
    setKids(kidsWithProgress)

    // Current day from first kid's progress
    if (kidsWithProgress[0]?.completedZones !== undefined) {
      const day = (kidsWithProgress[0].completedZones ?? 0) + 1
      const zones = ['Cabárceno','Covadonga','Costa Cantábrica','Fuente Dé','El Regreso']
      setCurrentDay(`Día ${Math.min(day, 5)} · ${zones[Math.min(day-1, 4)]}`)
    }

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function selectChild(child: Child) { setChildId(child.id); router.push('/map') }

  async function createAdult() {
    if (!adultName.trim()) { setFormError('Escribe un nombre'); return }
    if (!/^\d{4}$/.test(adultPin)) { setFormError('El PIN debe ser 4 dígitos'); return }
    if (adultPin !== adultPin2) { setFormError('Los PINs no coinciden'); return }
    setSaving(true); setFormError('')
    const res = await fetch('/api/adults', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: adultName.trim(), avatar: adultAvatar, pin: adultPin, adventureId: DEFAULT_ADVENTURE }),
    })
    if (res.ok) { await load(); setShowAdultForm(false); setAdultName(''); setAdultPin(''); setAdultPin2('') }
    else setFormError('Error al crear moderador')
    setSaving(false)
  }

  async function saveAdult() {
    if (!editAdult) return
    if (!editAdult.name.trim()) { setFormError('Escribe un nombre'); return }
    if (editAdult.pin && !/^\d{4}$/.test(editAdult.pin)) { setFormError('PIN debe ser 4 dígitos'); return }
    if (editAdult.pin && editAdult.pin !== editAdult.pin2) { setFormError('Los PINs no coinciden'); return }
    setSaving(true); setFormError('')
    const body: Record<string, string> = { name: editAdult.name, avatar: editAdult.avatar }
    if (editAdult.pin) body.pin = editAdult.pin
    const res = await fetch(`/api/adults/${editAdult.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (res.ok) { await load(); setEditAdult(null) } else setFormError('Error al guardar')
    setSaving(false)
  }

  async function createChild() {
    if (!childName.trim()) { setFormError('Escribe un nombre'); return }
    if (!parentId) { setFormError('Selecciona un moderador'); return }
    setSaving(true); setFormError('')
    const res = await fetch('/api/children', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: childName.trim(), avatar: childAvatar, parentId }),
    })
    if (res.ok) { await load(); setShowChildForm(false); setChildName('') }
    else setFormError('Error al crear explorador')
    setSaving(false)
  }

  async function saveChild() {
    if (!editChild) return
    if (!editChild.name.trim()) { setFormError('Escribe un nombre'); return }
    setSaving(true); setFormError('')
    const res = await fetch(`/api/children/${editChild.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editChild.name, avatar: editChild.avatar }),
    })
    if (res.ok) { await load(); setEditChild(null) } else setFormError('Error al guardar')
    setSaving(false)
  }

  async function deleteUser() {
    if (!confirmDelete) return
    setSaving(true)
    const url = confirmDelete.type === 'adult'
      ? `/api/adults/${confirmDelete.id}`
      : `/api/children/${confirmDelete.id}`
    await fetch(url, { method: 'DELETE' })
    await load(); setConfirmDelete(null); setSaving(false)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', marginBottom: 8, fontSize: '.9rem',
    fontFamily: 'var(--font-body)', border: '1.5px solid var(--border)',
    borderRadius: 'var(--r-sm)', outline: 'none', background: 'var(--bg)', color: 'var(--ink)',
  }

  function AvatarPicker({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (a: string) => void }) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {options.map(a => (
          <button key={a} onClick={() => onSelect(a)} style={{
            fontSize: '1.4rem', width: 42, height: 42,
            background: selected === a ? 'var(--amber-lt)' : 'var(--bg-muted)',
            border: `2px solid ${selected === a ? 'var(--amber)' : 'transparent'}`,
            borderRadius: 'var(--r-sm)', cursor: 'pointer',
          }}>{a}</button>
        ))}
      </div>
    )
  }

  function FormButtons({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>Cancelar</button>
        <button className="btn btn-success" style={{ flex: 2, opacity: saving ? .7 : 1 }}
          onClick={onSave} disabled={saving}>
          {saving ? <span className="spinner animate-spin" /> : 'Guardar'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* ── HERO — parchment map ── */}
      <div style={{ position: 'relative', height: 260, overflow: 'hidden', flexShrink: 0 }}>
        {/* Parchment base */}
        <div style={{ position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg,#f8edce,#f0e0aa,#e8d48e,#ddc87a)' }} />

        {/* SVG decorations */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 380 260" preserveAspectRatio="xMidYMid slice">
          <polygon points="0,260 50,180 110,210 170,140 230,200 290,155 350,185 380,165 380,260"
            fill="#7a5c14" opacity=".1"/>
          <path d="M0 260 Q80 230 160 242 Q240 252 320 228 Q355 218 380 232 L380 260 Z"
            fill="#4a7a28" opacity=".13"/>
          <rect x="10" y="10" width="360" height="240" rx="8" fill="none"
            stroke="rgba(100,65,15,.22)" stroke-width="2"/>
          <text x="18" y="30" fontSize="14" fill="rgba(100,65,15,.28)">✦</text>
          <text x="350" y="30" fontSize="14" fill="rgba(100,65,15,.28)">✦</text>
          <text x="18" y="248" fontSize="14" fill="rgba(100,65,15,.28)">✦</text>
          <text x="350" y="248" fontSize="14" fill="rgba(100,65,15,.28)">✦</text>
          <path d="M290 50 Q275 90 285 130 Q295 165 280 200"
            stroke="rgba(80,140,200,.18)" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <g stroke="rgba(100,65,15,.1)" strokeWidth="1.2">
            <path d="M50 190 L56 196 M56 190 L50 196"/>
            <path d="M310 120 L316 126 M316 120 L310 126"/>
          </g>
          <g transform="translate(340,220)" opacity=".18">
            <circle cx="0" cy="0" r="18" fill="none" stroke="#7a5010" strokeWidth="1"/>
            <path d="M0,-14 L2.5,-5 L0,-7.5 L-2.5,-5 Z" fill="#7a5010"/>
            <text x="0" y="-18" textAnchor="middle" fontSize="5" fill="#7a5010" fontFamily="'Fredoka',sans-serif">N</text>
          </g>
        </svg>

        {/* Trees */}
        {[
          { left: 14, top: 120, size: 18, delay: '0s' }, { left: 20, top: 142, size: 13, delay: '.5s' },
          { right: 14, top: 130, size: 16, delay: '.3s' }, { right: 20, top: 150, size: 12, delay: '.8s' },
        ].map((t, i) => (
          <div key={i} style={{
            position: 'absolute', ...t, fontSize: t.size, opacity: .32,
            animation: `treeSway ${2.5 + i * 0.4}s ease-in-out infinite alternate`,
            transformOrigin: 'bottom center',
          }}>🌲</div>
        ))}

        {/* Clouds */}
        <div style={{ position: 'absolute', left: '8%', top: 16, fontSize: 24, opacity: .35,
          animation: 'cloudDrift 8s ease-in-out infinite alternate' }}>☁</div>
        <div style={{ position: 'absolute', left: '60%', top: 10, fontSize: 18, opacity: .28,
          animation: 'cloudDrift 11s ease-in-out infinite alternate-reverse' }}>☁</div>

        {/* Content */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '20px 24px' }}>
          <div style={{ fontSize: '3.8rem', marginBottom: 10, animation: 'float 3s ease-in-out infinite',
            filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.2))' }}>🗺️</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#2a1505', textAlign: 'center',
            lineHeight: 1.1, margin: '0 0 6px',
            textShadow: '0 1px 0 rgba(255,255,255,.5)' }}>
            La Gran Aventura
          </h1>
          <p style={{ fontSize: '12px', color: 'rgba(60,35,8,.5)', fontFamily: 'var(--font-body)',
            fontWeight: 700, margin: '0 0 16px', letterSpacing: '.04em' }}>
            Potes · Semana Santa 2026
          </p>
          {currentDay && (
            <div style={{ background: 'rgba(232,150,14,.22)', border: '1.5px solid rgba(232,150,14,.4)',
              borderRadius: 99, padding: '5px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>📅</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#5a3000',
                fontFamily: 'var(--font-body)' }}>{currentDay}</span>
            </div>
          )}
        </div>

        {/* CSS animations */}
        <style>{`
          @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
          @keyframes cloudDrift{0%{transform:translateX(0)}100%{transform:translateX(12px)}}
          @keyframes treeSway{0%,100%{transform:rotate(-1.5deg)}50%{transform:rotate(1.5deg)}}
        `}</style>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', borderBottom: '1.5px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
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
            {kids.length === 0 ? (
              <div className="center" style={{ minHeight: '30vh' }}>
                <div style={{ fontSize: '2rem' }}>🧭</div>
                <p style={{ color: 'var(--ink-3)', fontSize: '.9rem', textAlign: 'center' }}>
                  Todavía no hay exploradores.<br/>Ve a Configurar para añadirlos.
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '.78rem', color: 'var(--ink-3)', marginBottom: 12,
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  ¿Quién juega hoy?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {kids.map(kid => {
                    const pct = kid.totalZones ? Math.round((kid.completedZones ?? 0) / kid.totalZones * 100) : 0
                    return (
                      <button key={kid.id} onClick={() => selectChild(kid)} style={{
                        display: 'flex', alignItems: 'center', gap: 13,
                        background: 'linear-gradient(135deg,#fffcf5,#fff8e8)',
                        border: '1.5px solid rgba(232,150,14,.3)',
                        borderRadius: 'var(--r-lg)', padding: '14px 16px',
                        cursor: 'pointer', textAlign: 'left',
                        boxShadow: '0 2px 10px rgba(232,150,14,.12)',
                        fontFamily: 'var(--font-body)', width: '100%', transition: 'transform .12s',
                      }}>
                        {/* Avatar */}
                        <div style={{ width: 52, height: 52, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#fef3d0,#fde8a0)',
                          border: '2.5px solid rgba(232,150,14,.5)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.9rem', flexShrink: 0 }}>
                          {kid.avatar}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)', marginBottom: 4 }}>
                            {kid.name}
                          </div>
                          {/* Progress bar */}
                          <div style={{ background: 'rgba(0,0,0,.08)', borderRadius: 99,
                            height: 5, marginBottom: 5, overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 99,
                              background: 'linear-gradient(90deg,#e8960e,#F5C842)',
                              transition: 'width .5s ease' }} />
                          </div>
                          {/* Badges + stats */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '10px', color: 'rgba(60,40,10,.5)',
                              fontWeight: 700 }}>
                              {kid.completedZones ?? 0}/{kid.totalZones ?? 5} días
                            </span>
                            {(kid.badges ?? []).length > 0 && (
                              <>
                                <span style={{ color: 'rgba(60,40,10,.2)', fontSize: '10px' }}>·</span>
                                <div style={{ display: 'flex', gap: 2 }}>
                                  {(kid.badges ?? []).slice(0, 4).map((b, i) => {
                                    const icons: Record<string,string> = {
                                      'superviviente-jumanji': '🎲',
                                      'guardian-dragon': '🐉',
                                      'mago-cantabrico': '⚡',
                                      'domador-dragon': '🦅',
                                      'explorador-legendario': '🌟',
                                    }
                                    return <span key={i} style={{ fontSize: '14px' }}>{icons[b] ?? '🏅'}</span>
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <span style={{ color: 'rgba(60,40,10,.25)', fontSize: '1.2rem' }}>→</span>
                      </button>
                    )
                  })}
                </div>

                {/* Subtle setup link */}
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <button onClick={() => setTab('setup')} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: '11px', color: 'rgba(60,40,10,.35)',
                    fontFamily: 'var(--font-body)', fontWeight: 700,
                  }}>
                    ⚙️ Configurar exploradores
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          /* ── SETUP TAB (mismo que antes) ── */
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: '.8rem', color: 'var(--ink-3)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em' }}>Moderadores</p>
                {!showAdultForm && !editAdult && (
                  <button onClick={() => { setShowAdultForm(true); setEditAdult(null); setFormError('') }}
                    className="btn btn-ghost" style={{ fontSize: '.8rem', padding: '4px 8px' }}>+ Añadir</button>
                )}
              </div>
              {adults.map(a => (
                <div key={a.id}>
                  {editAdult?.id === a.id ? (
                    <div className="card" style={{ padding: 16, marginBottom: 8 }}>
                      <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Editar moderador</h3>
                      <AvatarPicker options={ADULT_AVATARS} selected={editAdult.avatar}
                        onSelect={v => setEditAdult(p => p ? {...p, avatar: v} : p)} />
                      <input style={inputStyle} value={editAdult.name}
                        onChange={e => setEditAdult(p => p ? {...p, name: e.target.value} : p)} placeholder="Nombre" />
                      <input style={inputStyle} type="tel" inputMode="numeric" maxLength={4}
                        value={editAdult.pin} placeholder="Nuevo PIN (vacío = no cambiar)"
                        onChange={e => setEditAdult(p => p ? {...p, pin: e.target.value} : p)} />
                      {editAdult.pin && (
                        <input style={inputStyle} type="tel" inputMode="numeric" maxLength={4}
                          value={editAdult.pin2} placeholder="Repetir PIN"
                          onChange={e => setEditAdult(p => p ? {...p, pin2: e.target.value} : p)} />
                      )}
                      {formError && <p style={{ color: 'var(--red)', fontSize: '.8rem', marginBottom: 8 }}>{formError}</p>}
                      <FormButtons onSave={saveAdult} onCancel={() => { setEditAdult(null); setFormError('') }} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                      background: 'var(--purple-lt)', borderRadius: 'var(--r-md)', marginBottom: 8,
                      border: '1px solid rgba(108,63,212,.15)' }}>
                      <span style={{ fontSize: '1.4rem' }}>{a.avatar}</span>
                      <span style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--purple)', flex: 1 }}>{a.name}</span>
                      <button onClick={() => { setEditAdult({ id: a.id, name: a.name, avatar: a.avatar, pin: '', pin2: '' }); setShowAdultForm(false); setFormError('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', padding: '4px 6px' }}>✏️</button>
                      <button onClick={() => setConfirmDelete({ type: 'adult', id: a.id, name: a.name })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', color: 'var(--red)', padding: '4px 6px' }}>🗑️</button>
                    </div>
                  )}
                </div>
              ))}
              {showAdultForm && (
                <div className="card" style={{ padding: 16, marginTop: 8 }}>
                  <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Nuevo moderador</h3>
                  <AvatarPicker options={ADULT_AVATARS} selected={adultAvatar} onSelect={setAdultAvatar} />
                  {[
                    { val: adultName, set: setAdultName, ph: 'Nombre', type: 'text' },
                    { val: adultPin, set: setAdultPin, ph: 'PIN (4 dígitos)', type: 'tel' },
                    { val: adultPin2, set: setAdultPin2, ph: 'Repetir PIN', type: 'tel' },
                  ].map(({ val, set, ph, type }) => (
                    <input key={ph} style={inputStyle} type={type}
                      inputMode={type === 'tel' ? 'numeric' : undefined}
                      value={val} onChange={e => set(e.target.value)}
                      placeholder={ph} maxLength={type === 'tel' ? 4 : 20} />
                  ))}
                  {formError && <p style={{ color: 'var(--red)', fontSize: '.8rem', marginBottom: 8 }}>{formError}</p>}
                  <FormButtons onSave={createAdult} onCancel={() => { setShowAdultForm(false); setFormError('') }} />
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: '.8rem', color: 'var(--ink-3)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em' }}>Exploradores</p>
                {adults.length > 0 && !showChildForm && !editChild && (
                  <button onClick={() => { setShowChildForm(true); setEditChild(null); setFormError('') }}
                    className="btn btn-ghost" style={{ fontSize: '.8rem', padding: '4px 8px' }}>+ Añadir</button>
                )}
              </div>
              {kids.map(k => (
                <div key={k.id}>
                  {editChild?.id === k.id ? (
                    <div className="card" style={{ padding: 16, marginBottom: 8 }}>
                      <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Editar explorador</h3>
                      <AvatarPicker options={AVATARS} selected={editChild.avatar}
                        onSelect={v => setEditChild(p => p ? {...p, avatar: v} : p)} />
                      <input style={inputStyle} value={editChild.name}
                        onChange={e => setEditChild(p => p ? {...p, name: e.target.value} : p)}
                        placeholder="Nombre del explorador" />
                      {formError && <p style={{ color: 'var(--red)', fontSize: '.8rem', marginBottom: 8 }}>{formError}</p>}
                      <FormButtons onSave={saveChild} onCancel={() => { setEditChild(null); setFormError('') }} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                      background: 'var(--amber-lt)', borderRadius: 'var(--r-md)', marginBottom: 8,
                      border: '1px solid rgba(232,150,14,.2)' }}>
                      <span style={{ fontSize: '1.4rem' }}>{k.avatar}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--amber-dk)' }}>{k.name}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--ink-3)' }}>Familia de {k.parentName}</div>
                      </div>
                      <button onClick={() => { setEditChild({ id: k.id, name: k.name, avatar: k.avatar }); setShowChildForm(false); setFormError('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', padding: '4px 6px' }}>✏️</button>
                      <button onClick={() => setConfirmDelete({ type: 'child', id: k.id, name: k.name })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.85rem', color: 'var(--red)', padding: '4px 6px' }}>🗑️</button>
                    </div>
                  )}
                </div>
              ))}
              {showChildForm && adults.length > 0 && (
                <div className="card" style={{ padding: 16, marginTop: 8 }}>
                  <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>Nuevo explorador</h3>
                  <AvatarPicker options={AVATARS} selected={childAvatar} onSelect={setChildAvatar} />
                  <input style={inputStyle} type="text" value={childName}
                    onChange={e => setChildName(e.target.value)}
                    placeholder="Nombre del explorador" maxLength={20} />
                  {adults.length > 1 && (
                    <select value={parentId} onChange={e => setParentId(e.target.value)}
                      style={{ ...inputStyle, marginBottom: 8 }}>
                      {adults.map(a => <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>)}
                    </select>
                  )}
                  {formError && <p style={{ color: 'var(--red)', fontSize: '.8rem', marginBottom: 8 }}>{formError}</p>}
                  <FormButtons onSave={createChild} onCancel={() => { setShowChildForm(false); setFormError('') }} />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Confirm delete */}
      {confirmDelete && (
        <div className="drawer-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-handle" />
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🗑️</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
                ¿Eliminar a {confirmDelete.name}?
              </h3>
              <p style={{ fontSize: '.85rem', color: 'var(--ink-3)', marginTop: 6 }}>
                {confirmDelete.type === 'adult'
                  ? 'Se eliminarán también todos sus exploradores y su progreso.'
                  : 'Se eliminará todo su progreso de la aventura.'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className="btn" style={{ flex: 1, background: 'var(--red)', color: '#fff',
                opacity: saving ? .7 : 1, boxShadow: '0 4px 0 #8a2020' }}
                onClick={deleteUser} disabled={saving}>
                {saving ? <span className="spinner animate-spin" /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
