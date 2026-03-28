interface Props { value: number; label?: string; gold?: boolean }

export default function ProgressBar({ value, label, gold }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--ink-2)' }}>{label}</span>}
      <div className="progress-wrap">
        <div className={`progress-fill${gold ? ' progress-fill-gold' : ''}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  )
}
