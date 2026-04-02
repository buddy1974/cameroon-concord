'use client'
import { useEffect, useRef } from 'react'

interface Props { articleId: number }

export function HitTracker({ articleId }: Props) {
  const tracked = useRef(false)
  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    fetch(`/api/hit/${articleId}`, { method: 'POST' }).catch(() => {})
  }, [articleId])
  return null
}
