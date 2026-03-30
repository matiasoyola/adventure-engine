'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useProgress, getChildId } from '@/hooks/useProgress'
import type { Photo } from '@/lib/db/schema'

export default function GalleryPage() {
  const router = useRouter()
  const { data } = useProgress()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Photo | null>(null)

  useEffect(() => { if (!getChildId()) router.replace('/') }, [router])

  useEffect(() => {
    if (!data) return
    fetch(`/api/photos?adventureId=${data.gameState.adventureId}`)
      .then(r => r.json())
      .then(d => { setPhotos(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [data?.gameState.adventureId])

  // Group by zone
  const byZone: Record<string, Photo[]> = {}
  for (const p of photos) {
    if (!byZone[p.zoneId]) byZone[p.zoneId] = []
    byZone[p.zoneId].push(p)
  }

  return (
    <div>
      <div className="header">
        <Link href="/map" className="btn btn-ghost" style={{ padding: '6px 4px' }}>← Mapa</Link>
        <span className="header-title" style={{ flex: 1, textAlign: 'center' }}>
          📷 Galería
        </span>
        <div style={{ width: 56 }} />
      </div>

      <div className="page" style={{ paddingTop: 20 }}>
        {loading ? (
          <div className="center"><div className="spinner animate-spin" /></div>
        ) : photos.length === 0 ? (
          <div className="center" style={{ minHeight: '40vh' }}>
            <span style={{ fontSize: '3rem' }}>📷</span>
            <p style={{ color: 'var(--ink-3)', textAlign: 'center' }}>
              Todavía no hay fotos.<br/>Completad actividades de foto para verlas aquí.
            </p>
          </div>
        ) : (
          Object.entries(byZone).map(([zoneId, zonePhs]) => (
            <div key={zoneId} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--ink-3)',
                  textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font-body)' }}>
                  {zonePhs[0].zoneName}
                </span>
                <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {zonePhs.map(photo => (
                  <div key={photo.id} onClick={() => setSelected(photo)}
                    style={{ borderRadius: 'var(--r-md)', overflow: 'hidden',
                      cursor: 'pointer', position: 'relative',
                      boxShadow: 'var(--shadow)', aspectRatio: '1' }}>
                    <img src={photo.url} alt={photo.childName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,.6))',
                      padding: '16px 8px 6px',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <span style={{ fontSize: '1rem' }}>{photo.childAvatar}</span>
                      <span style={{ fontSize: '.72rem', color: '#fff', fontWeight: 700,
                        fontFamily: 'var(--font-body)' }}>{photo.childName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,.9)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <img src={selected.url} alt={selected.childName}
            style={{ maxWidth: '100%', maxHeight: '75dvh',
              objectFit: 'contain', borderRadius: 'var(--r-md)' }} />
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>
              {selected.childAvatar} {selected.childName}
            </div>
            <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.82rem',
              fontFamily: 'var(--font-body)', marginTop: 4 }}>
              {selected.zoneName}
            </div>
          </div>
          <button onClick={() => setSelected(null)} style={{
            marginTop: 20, background: 'rgba(255,255,255,.15)',
            border: '1px solid rgba(255,255,255,.2)', borderRadius: 'var(--r-md)',
            color: '#fff', padding: '10px 24px', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: '.9rem', fontWeight: 600,
          }}>
            Cerrar
          </button>
        </div>
      )}
    </div>
  )
}
