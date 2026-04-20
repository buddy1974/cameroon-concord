'use client'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('cc_theme') as 'dark' | 'light' | null
    if (saved) {
      setTheme(saved)
      document.documentElement.setAttribute('data-theme', saved)
    }
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('cc_theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: 'transparent', border: '1px solid #1E1E1E',
        cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '1rem',
        color: '#555', transition: 'all 0.2s',
      }}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  )
}
