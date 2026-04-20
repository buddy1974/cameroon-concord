'use client'
import { useEffect, useState } from 'react'

export function PushSubscribeButton() {
  const [status, setStatus] = useState<'idle' | 'subscribed' | 'unsupported'>('idle')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    if (localStorage.getItem('cc_push_subscribed') === 'true') {
      setStatus('subscribed')
    }
  }, [])

  async function subscribe() {
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      })
      await fetch('/api/push/subscribe', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(sub),
      })
      localStorage.setItem('cc_push_subscribed', 'true')
      setStatus('subscribed')
    } catch {
      console.error('Push subscription failed')
    }
  }

  if (status === 'unsupported') return null
  if (status === 'subscribed') return (
    <div style={{ fontSize: '0.72rem', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
      🔔 Breaking news alerts on
    </div>
  )

  return (
    <button onClick={subscribe} style={{
      fontSize: '0.72rem', color: '#F5A623', background: 'none',
      border: '1px solid #F5A623', borderRadius: '6px',
      padding: '6px 12px', cursor: 'pointer', display: 'flex',
      alignItems: 'center', gap: '6px',
    }}>
      🔔 Get breaking news alerts
    </button>
  )
}
