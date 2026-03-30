'use client'

interface Props {
  isOnline: boolean
  pending: number
  syncing: boolean
}

export default function OfflineBanner({ isOnline, pending, syncing }: Props) {
  if (isOnline && pending === 0) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100, maxWidth: 480, width: '100%',
      background: isOnline ? 'var(--green)' : '#333',
      color: '#fff', textAlign: 'center',
      padding: '8px 16px',
      fontFamily: 'var(--font-body)', fontSize: '.82rem', fontWeight: 700,
      transition: 'background .3s',
    }}>
      {syncing
        ? '↑ Sincronizando...'
        : isOnline && pending > 0
        ? `✓ Volvió la conexión — sincronizando ${pending} acciones`
        : `📡 Sin conexión — tus avances se guardarán al conectarte`}
    </div>
  )
}
