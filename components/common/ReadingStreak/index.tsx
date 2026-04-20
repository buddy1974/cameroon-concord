'use client'
import { useEffect, useState } from 'react'

export function ReadingStreak() {
  const [streak,    setStreak]    = useState(0)
  const [showBadge, setShowBadge] = useState(false)

  useEffect(() => {
    const today          = new Date().toDateString()
    const lastVisit      = localStorage.getItem('cc_last_visit')
    const currentStreak  = parseInt(localStorage.getItem('cc_streak') || '0')

    if (lastVisit === today) {
      setStreak(currentStreak)
    } else {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const isConsecutive = lastVisit === yesterday.toDateString()
      const newStreak     = isConsecutive ? currentStreak + 1 : 1
      localStorage.setItem('cc_streak',     String(newStreak))
      localStorage.setItem('cc_last_visit', today)
      setStreak(newStreak)
    }
    setShowBadge(true)
  }, [])

  if (!showBadge || streak < 2) return null

  return (
    <div style={{
      position: 'fixed', bottom: '80px', right: '16px', zIndex: 50,
      background: '#0F0F0F', border: '1px solid #F5A623',
      borderRadius: '20px', padding: '6px 12px',
      display: 'flex', alignItems: 'center', gap: '6px',
      fontSize: '0.75rem', color: '#F5A623', fontWeight: 700,
      boxShadow: '0 4px 20px rgba(245,166,35,0.2)',
      animation: 'fadeIn 0.5s ease',
    }}>
      🔥 {streak} day streak
    </div>
  )
}
