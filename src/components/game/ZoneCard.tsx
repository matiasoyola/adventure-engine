import Link from 'next/link'
import type { ZoneView } from '@/lib/engine/types'
import ProgressBar from './ProgressBar'

interface Props { zone: ZoneView }

const STATUS_LABEL: Record<string, string> = {
  available: 'Disponible', in_progress: 'En curso', completed: 'Completada',
}
const STATUS_CLASS: Record<string, string> = {
  available: 'badge-available', in_progress: 'badge-progress', completed: 'badge-completed',
}

export default function ZoneCard({ zone }: Props) {
  const pct = zone.stepsTotal > 0 ? Math.round((zone.stepsCompleted / zone.stepsTotal) * 100) : 0

  return (
    <Link href={`/zone/${zone.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card" style={{
        padding: '16px', display: 'flex', flexDirection: 'column', gap: 10,
        borderLeft: zone.status === 'in_progress' ? '4px solid var(--amber)'
          : zone.status === 'completed' ? '4px solid var(--green)'
          : '4px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{ fontSize: '2rem', lineHeight: 1, flexShrink: 0 }}>{zone.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{zone.name}</h3>
              <span className={`badge ${STATUS_CLASS[zone.status]}`}>{STATUS_LABEL[zone.status]}</span>
            </div>
            <p style={{ fontSize: '.85rem', color: 'var(--ink-3)', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {zone.description}
            </p>
          </div>
        </div>
        <ProgressBar value={pct} label={`${zone.stepsCompleted} / ${zone.stepsTotal} pistas`} />
        {zone.badge.unlocked && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--amber-lt)', borderRadius: 'var(--r-sm)', padding: '6px 10px' }}>
            <span style={{ fontSize: '1.1rem' }}>{zone.badge.icon}</span>
            <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#7a5000' }}>
              {zone.badge.name} desbloqueada
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
