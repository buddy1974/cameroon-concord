'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installed,      setInstalled]      = useState(false)
  const [showIOSModal,   setShowIOSModal]   = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler as EventListener)

    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      fetch('/api/pwa/track', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ event: 'installed' }),
      })
    })

    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener)
  }, [])

  const handleInstallClick = async () => {
    fetch('/api/pwa/track', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ event: 'click' }),
    })

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        fetch('/api/pwa/track', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ event: 'accepted' }),
        })
      }
      setDeferredPrompt(null)
    } else {
      setShowIOSModal(true)
    }
  }

  if (installed) return null

  const isIOS = /iphone|ipad|ipod/i.test(
    typeof navigator !== 'undefined' ? navigator.userAgent : ''
  )

  return (
    <>
      <div
        style={{
          width: '100%', maxWidth: '900px', margin: '16px auto',
          cursor: 'pointer', position: 'relative', borderRadius: '12px',
          overflow: 'hidden', boxShadow: '0 4px 20px rgba(204,0,0,0.3)',
        }}
        onClick={handleInstallClick}
      >
        <Image
          src="/app-install.png"
          alt="Install Cameroon Concord App"
          width={900}
          height={400}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          priority
        />
        <div style={{
          position: 'absolute', bottom: '16px', right: '16px',
          background: '#cc0000', color: '#fff', padding: '10px 20px',
          borderRadius: '8px', fontWeight: 700, fontSize: '14px',
        }}>
          {deferredPrompt ? '📱 Install App' : isIOS ? '📱 Add to Home Screen' : '📱 Get the App'}
        </div>
      </div>

      {/* iOS instructions modal */}
      {showIOSModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
            zIndex: 9999, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '20px',
          }}
          onClick={() => setShowIOSModal(false)}
        >
          <div
            style={{
              background: '#1a1a1a', borderRadius: '16px',
              padding: '32px', maxWidth: '360px', textAlign: 'center', color: '#fff',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ color: '#cc0000', marginBottom: '16px' }}>Install Cameroon Concord</h3>
            <p style={{ color: '#ccc', marginBottom: '12px', lineHeight: 1.6 }}>
              1. Tap the <strong>Share</strong> button at the bottom of your browser
            </p>
            <p style={{ color: '#ccc', marginBottom: '12px', lineHeight: 1.6 }}>
              2. Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>
            </p>
            <p style={{ color: '#ccc', marginBottom: '24px', lineHeight: 1.6 }}>
              3. Tap <strong>&ldquo;Add&rdquo;</strong> to install
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              style={{
                background: '#cc0000', color: '#fff', border: 'none',
                padding: '12px 32px', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 700,
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
