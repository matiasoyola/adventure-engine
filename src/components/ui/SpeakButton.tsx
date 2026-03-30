'use client'

import { useSpeech } from '@/hooks/useSpeech'

interface Props {
  text: string
  size?: 'sm' | 'md'
}

export default function SpeakButton({ text, size = 'sm' }: Props) {
  const { speak, speaking, supported } = useSpeech()

  if (!supported) return null

  const dim = size === 'md' ? 36 : 28

  return (
    <button
      onClick={e => { e.stopPropagation(); speak(text) }}
      title={speaking ? 'Parar lectura' : 'Escuchar'}
      style={{
        width: dim, height: dim,
        borderRadius: '50%',
        border: `1.5px solid ${speaking ? 'var(--amber)' : 'var(--border)'}`,
        background: speaking ? 'var(--amber-lt)' : 'var(--bg-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
        fontSize: size === 'md' ? '1rem' : '.8rem',
        transition: 'all .15s',
      }}
    >
      {speaking ? '⏹' : '🔊'}
    </button>
  )
}
