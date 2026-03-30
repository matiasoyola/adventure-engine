'use client'

import { useState, useRef } from 'react'
import type { StepView, GameAction } from '@/lib/engine/types'

interface Props {
  step: StepView
  zoneId: string
  clueId: string
  childId: string
  adventureId: string
  onClose: () => void
  onComplete: (action: GameAction) => Promise<void>
}

export default function StepDrawer({ step, zoneId, clueId, childId, adventureId, onClose, onComplete }: Props) {
  const [saving, setSaving]       = useState(false)
  const [done, setDone]           = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const isPhoto = step.type === 'photo'

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('La foto no puede superar 10MB')
      return
    }
    setUploadError('')
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleComplete() {
    setSaving(true)
    setUploadError('')

    try {
      // Si es foto, subir primero
      if (isPhoto && photoFile) {
        const formData = new FormData()
        formData.append('file', photoFile)
        formData.append('childId', childId)
        formData.append('adventureId', adventureId)
        formData.append('zoneId', zoneId)
        formData.append('stepId', step.id)

        const res = await fetch('/api/photos', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json()
          setUploadError(err.error ?? 'Error al subir la foto')
          setSaving(false)
          return
        }
      }

      await onComplete({ type: 'complete_step', zoneId, clueId, stepId: step.id })
      setDone(true)
      setTimeout(onClose, 800)
    } catch {
      setUploadError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const canComplete = !isPhoto || !!photoFile || step.completed

  return (
    <div className="drawer-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="drawer">
        <div className="drawer-handle" />

        {/* Type badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '.07em', color: 'var(--ink-3)' }}>
            {isPhoto ? '📷 Foto' : '✅ Misión'}
          </span>
          {step.completed && <span className="badge badge-completed">Completada</span>}
        </div>

        {/* Step text */}
        <div style={{ background: 'var(--bg-muted)', borderRadius: 'var(--r-md)',
          padding: '16px', marginBottom: 20 }}>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--ink)',
            fontWeight: 600, margin: 0 }}>
            {step.text}
          </p>
        </div>

        {/* Photo picker */}
        {isPhoto && !step.completed && (
          <div style={{ marginBottom: 20 }}>
            <input ref={fileRef} type="file" accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }} />

            {photoPreview ? (
              <div style={{ position: 'relative', borderRadius: 'var(--r-md)', overflow: 'hidden',
                border: '2px solid var(--green)', marginBottom: 10 }}>
                <img src={photoPreview} alt="preview"
                  style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
                <button onClick={() => { setPhotoPreview(null); setPhotoFile(null) }}
                  style={{ position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,.5)', border: 'none', borderRadius: '50%',
                    width: 28, height: 28, color: '#fff', cursor: 'pointer', fontSize: '.9rem' }}>
                  ✕
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} style={{
                width: '100%', padding: '20px', border: '2px dashed var(--border)',
                borderRadius: 'var(--r-md)', background: 'var(--bg-muted)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8, fontFamily: 'var(--font-body)',
              }}>
                <span style={{ fontSize: '2rem' }}>📷</span>
                <span style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--ink-2)' }}>
                  Seleccionar foto del carrete
                </span>
                <span style={{ fontSize: '.75rem', color: 'var(--ink-3)' }}>
                  Máximo 10MB · JPG o PNG
                </span>
              </button>
            )}

            {uploadError && (
              <p style={{ color: 'var(--red)', fontSize: '.82rem', marginTop: 6 }}>{uploadError}</p>
            )}
          </div>
        )}

        {/* Action */}
        {step.completed ? (
          <div style={{ textAlign: 'center', padding: '12px 0',
            color: 'var(--green)', fontWeight: 700, fontSize: '1.1rem' }}>
            ✓ ¡Ya completada!
          </div>
        ) : done ? (
          <div className="animate-pop" style={{ textAlign: 'center', padding: '12px 0',
            color: 'var(--green)', fontWeight: 700, fontSize: '1.3rem' }}>
            ✓ ¡Bien hecho!
          </div>
        ) : (
          <button className="btn btn-success" onClick={handleComplete}
            disabled={saving || !canComplete}
            style={{ opacity: (saving || !canComplete) ? .5 : 1 }}>
            {saving
              ? <span className="spinner animate-spin" />
              : isPhoto && !photoFile
              ? '📷 Primero selecciona una foto'
              : isPhoto
              ? '📷 Enviar foto'
              : '✓ ¡Misión cumplida!'}
          </button>
        )}
      </div>
    </div>
  )
}
