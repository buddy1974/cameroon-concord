'use client'
import { useEffect } from 'react'

export function ReadingProgress() {
  useEffect(() => {
    const bar = document.getElementById('rpbar')
    if (!bar) return
    const onScroll = () => {
      const doc   = document.documentElement
      const total = doc.scrollHeight - doc.clientHeight
      bar.style.width = total > 0 ? `${(doc.scrollTop / total) * 100}%` : '0%'
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return <div id="rpbar" style={{ width: '0%' }} />
}
