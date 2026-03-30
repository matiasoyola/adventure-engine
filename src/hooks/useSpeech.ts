'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface SpeechOptions {
  lang?: string
  rate?: number
  pitch?: number
}

export function useSpeech(options: SpeechOptions = {}) {
  const { lang = 'es-ES', rate = 0.9, pitch = 1 } = options
  const [speaking, setSpeaking]     = useState(false)
  const [supported, setSupported]   = useState(false)
  const utteranceRef                = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!supported) return

    // Si ya está hablando el mismo texto, parar
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang  = lang
    utterance.rate  = rate
    utterance.pitch = pitch

    utterance.onstart = () => setSpeaking(true)
    utterance.onend   = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [supported, speaking, lang, rate, pitch])

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
    }
  }, [])

  return { speak, stop, speaking, supported }
}
