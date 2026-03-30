'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { setChildId } from '@/hooks/useProgress'

interface Adult { id: string; name: string; avatar: string; adventureId: string }
interface Child { id: string; name: string; avatar: string; parentId: string; parentName: string }

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
    setAdults(a); setKids(k)
    if (a.length > 0) setParentId(a[0].id)
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
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) { await load(); setEditAdult(null) }
    else setFormError('Error al guardar')
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
    if (res.ok) { await load(); setEditChild(null) }
    else setFormError('Error al guardar')
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

  const inputStyle = {
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

      {/* Hero */}
      <div style={{ padding: '36px 20px 24px',
        background: 'linear-gradient(180deg,#1a1a2e,#16213e)',
        textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: .5, backgroundImage:
          'radial-gradient(1px 1px at 20% 30%,white,transparent),radial-gradient(1.5px 1.5px at 70% 15%,white,transparent),radial-gradient(1px 1px at 50% 60%,white,transparent),radial-gradient(1px 1px at 85% 45%,white,transparent)' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }} className="animate-float">🗺️</div>
          <h1 style={{ color: '#fff', fontSize: '1.7rem' }}>La Gran Aventura</h1>
          <p style={{ color: 'rgba(255,255,255,.6)', fontSize: '.85rem', marginTop: 4 }}>
            Potes · Semana Santa 2026
          </p>
          <p style={{ color: 'rgba(255,255,255,.25)', fontSize: '.7rem', marginTop: 4 }}>v4.0.0</p>
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
            {kids.length === 0 ? (
              <div className="center" style={{ minHeight: '30vh' }}>
                <div style={{ fontSize: '2rem' }}>🧭</div>
                <p style={{ color: 'var(--ink-3)', fontSize: '.9rem', textAlign: 'center' }}>
                  Todavía no hay exploradores.<br/>Ve a Configurar para añadirlos.
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '.8rem', color: 'var(--ink-3)', marginBottom: 12,
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  ¿Quién juega hoy?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {kids.map(kid => (
                    <button key={kid.id} onClick={() => selectChild(kid)} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      background: 'var(--bg-card)', border: '1.5px solid var(--border)',
                      borderRadius: 'var(--r-lg)', padding: '14px 16px',
                      cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow)',
                      fontFamily: 'var(--font-body)', width: '100%',
                    }}>
                      <span style={{ width: 52, height: 52, borderRadius: '50%',
                        background: 'var(--amber-lt)', border: '2px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.9rem', flexShrink: 0 }}>{kid.avatar}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--ink)' }}>{kid.name}</div>
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
          <>
            {/* ── ADULTS ── */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: '.8rem', color: 'var(--ink-3)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em' }}>Moderadores</p>
                {!showAdultForm && !editAdult && (
                  <button onClick={() => { setShowAdultForm(true); setEditAdult(null); setFormError('') }}
                    className="btn btn-ghost" style={{ fontSize: '.8rem', padding: '4px 8px' }}>
                    + Añadir
                  </button>
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
                        onChange={e => setEditAdult(p => p ? {...p, name: e.target.value} : p)}
                        placeholder="Nombre" />
                      <input style={inputStyle} type="tel" inputMode="numeric" maxLength={4}
                        value={editAdult.pin} placeholder="Nuevo PIN (dejar vacío para no cambiar)"
                        onChange={e => setEditAdult(p => p ? {...p, pin: e.target.value} : p)} />
                      {editAdult.pin && (
                        <input style={inputStyle} type="tel" inputMode="numeric" maxLength={4}
                          value={editAdult.pin2} placeholder="Repetir nuevo PIN"
                          onChange={e => setEditAdult(p => p ? {...p, pin2: e.target.value} : p)} />
                      )}
                      {formError && <p style={{ color: 'var(--red)', fontSize: '.8rem', marginBottom: 8 }}>{formError}</p>}
                      <FormButtons onSave={saveAdult} onCancel={() => { setEditAdult(null); setFormError('') }} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', background: 'var(--purple-lt)',
                      borderRadius: 'var(--r-md)', marginBottom: 8,
                      border: '1px solid rgba(108,63,212,.15)' }}>
                      <span style={{ fontSize: '1.4rem' }}>{a.avatar}</span>
                      <span style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--purple)', flex: 1 }}>{a.name}</span>
                      <button onClick={() => { setEditAdult({ id: a.id, name: a.name, avatar: a.avatar, pin: '', pin2: '' }); setShowAdultForm(false); setFormError('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8rem',
                          color: 'var(--ink-3)', padding: '4px 6px' }}>✏️</button>
                      <button onClick={() => setConfirmDelete({ type: 'adult', id: a.id, name: a.name })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8rem',
                          color: 'var(--red)', padding: '4px 6px' }}>🗑️</button>
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

            {/* ── CHILDREN ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: '.8rem', color: 'var(--ink-3)', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '.05em' }}>Exploradores</p>
                {adults.length > 0 && !showChildForm && !editChild && (
                  <button onClick={() => { setShowChildForm(true); setEditChild(null); setFormError('') }}
                    className="btn btn-ghost" style={{ fontSize: '.8rem', padding: '4px 8px' }}>
                    + Añadir
                  </button>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 14px', background: 'var(--amber-lt)',
                      borderRadius: 'var(--r-md)', marginBottom: 8,
                      border: '1px solid rgba(232,150,14,.2)' }}>
                      <span style={{ fontSize: '1.4rem' }}>{k.avatar}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--amber-dk)' }}>{k.name}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--ink-3)' }}>Familia de {k.parentName}</div>
                      </div>
                      <button onClick={() => { setEditChild({ id: k.id, name: k.name, avatar: k.avatar }); setShowChildForm(false); setFormError('') }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '.8rem', color: 'var(--ink-3)', padding: '4px 6px' }}>✏️</button>
                      <button onClick={() => setConfirmDelete({ type: 'child', id: k.id, name: k.name })}
                        style={{ background: 'none', border: 'none', cursor: 'pointer',
                          fontSize: '.8rem', color: 'var(--red)', padding: '4px 6px' }}>🗑️</button>
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

      {/* Confirm delete dialog */}
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
              <button className="btn btn-secondary" style={{ flex: 1 }}
                onClick={() => setConfirmDelete(null)}>Cancelar</button>
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
