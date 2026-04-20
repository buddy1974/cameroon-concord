'use client'
import { useEffect, useState, useRef } from 'react'

interface Props {
  text: string
  title: string
}

export function AudioPlayer({ text, title }: Props) {
  const [playing,   setPlaying]   = useState(false)
  const [supported, setSupported] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const wordsRef     = useRef<string[]>([])
  const wordIndexRef = useRef(0)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true)
    }
    return () => { window.speechSynthesis?.cancel() }
  }, [])

  function stripHtml(html: string) {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  function handlePlay() {
    if (playing) {
      window.speechSynthesis.cancel()
      setPlaying(false)
      setProgress(0)
      return
    }
    const clean = stripHtml(text)
    wordsRef.current     = clean.split(' ')
    wordIndexRef.current = 0
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.rate  = 0.95
    utterance.pitch = 1
    utterance.lang  = 'en-GB'
    utterance.onboundary = (e) => {
      if (e.name === 'word') {
        wordIndexRef.current++
        setProgress(Math.round((wordIndexRef.current / wordsRef.current.length) * 100))
      }
    }
    utterance.onend   = () => { setPlaying(false); setProgress(0) }
    utterance.onerror = () => { setPlaying(false); setProgress(0) }
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
    setPlaying(true)
  }

  if (!supported) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 16px', background: '#0F0F0F',
      border: '1px solid #1A1A1A', borderRadius: '10px', margin: '16px 0',
    }}>
      <button
        onClick={handlePlay}
        style={{
          width: '36px', height: '36px', borderRadius: '50%',
          background: playing ? '#C8102E' : '#1A1A1A',
          border: '1px solid #2A2A2A', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, fontSize: '0.9rem',
        }}
      >
        {playing ? '⏹' : '▶'}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.72rem', color: '#777', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {playing ? 'Now reading...' : 'Listen to article'} — {title}
        </div>
        <div style={{ height: '3px', background: '#1A1A1A', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#C8102E', width: `${progress}%`, transition: 'width 0.3s' }} />
        </div>
      </div>
      <div style={{ fontSize: '0.65rem', color: '#444', flexShrink: 0 }}>
        {progress > 0 ? `${progress}%` : 'Free'}
      </div>
    </div>
  )
}
