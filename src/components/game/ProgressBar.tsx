interface Props { value: number; label?: string }

export default function ProgressBar({ value, label }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--ink-2)' }}>{label}</span>}
      <div className="progress-wrap">
        <div className="progress-fill" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
    </div>
  )
}
