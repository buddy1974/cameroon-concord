'use client'
import { useEffect } from 'react'

export function GeoTracker() {
  useEffect(() => {
    fetch('/api/geo/track', { method: 'POST' }).catch(() => {})
  }, [])
  return null
}
