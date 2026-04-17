'use client'
import { useEffect, useState } from 'react'

type Platform = 'android' | 'ios' | 'desktop' | 'unknown'

export default function InstallBanner() {
  const [platform,       setPlatform]       = useState<Platform>('unknown')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installed,      setInstalled]      = useState(false)
  const [showIOSModal,   setShowIOSModal]   = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios')
    else if (/android/.test(ua)) setPlatform('android')
    else setPlatform('desktop')

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    // Pick up prompt captured before React hydrated
    if ((window as any).__deferredInstallPrompt) {
      setDeferredPrompt((window as any).__deferredInstallPrompt)
    }

    // Also listen for future fires (e.g. slow load)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler as any)
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      fetch('/api/pwa/track', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ event: 'installed' }),
      })
    })
    return () => window.removeEventListener('beforeinstallprompt', handler as any)
  }, [])

  if (installed) return null

  const handleClick = async () => {
    fetch('/api/pwa/track', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ event: 'click' }),
    })

    if (platform === 'android' && deferredPrompt) {
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
    } else if (platform === 'ios') {
      setShowIOSModal(true)
    } else {
      if (deferredPrompt) {
        deferredPrompt.prompt()
        setDeferredPrompt(null)
      }
    }
  }

  const buttonLabel =
    platform === 'android' ? '⬇ Install App Free'
    : platform === 'ios'   ? '📲 Add to Home Screen'
    : '💻 Install App'

  return (
    <>
      <div
        onClick={handleClick}
        style={{
          width: '100%', maxWidth: '900px', margin: '16px auto',
          cursor: 'pointer', position: 'relative', borderRadius: '12px',
          overflow: 'hidden', boxShadow: '0 4px 20px rgba(204,0,0,0.3)',
        }}
      >
        <img
          src="/WEB-MOBILE-APP-BANNER.png"
          alt="Install Cameroon Concord App"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onError={e => (e.target as HTMLImageElement).style.display = 'none'}
        />
        <div style={{
          position: 'absolute', bottom: '16px', right: '16px',
          background: '#cc0000', color: '#fff', padding: '10px 20px',
          borderRadius: '8px', fontWeight: 700, fontSize: '14px',
        }}>
          {buttonLabel}
        </div>
      </div>

      {showIOSModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.88)', zIndex: 9999,
            display: 'flex', alignItems: 'flex-end',
            justifyContent: 'center', padding: '0 0 40px',
          }}
          onClick={() => setShowIOSModal(false)}
        >
          <div
            style={{
              background: '#1a1a1a', borderRadius: '20px',
              padding: '32px 28px', maxWidth: '380px',
              width: '100%', textAlign: 'center', color: '#fff',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>📲</div>
            <h3 style={{ color: '#cc0000', marginBottom: '20px', fontSize: '18px' }}>
              Install on iPhone
            </h3>
            <div style={{
              background: '#111', borderRadius: '12px',
              padding: '16px', marginBottom: '20px',
              textAlign: 'left', lineHeight: '2',
            }}>
              <p style={{ color: '#ccc', margin: '0 0 8px' }}>
                1. Tap <strong style={{ color: '#fff' }}>⎋ Share</strong> at the bottom of Safari
              </p>
              <p style={{ color: '#ccc', margin: '0 0 8px' }}>
                2. Scroll and tap <strong style={{ color: '#fff' }}>&ldquo;Add to Home Screen&rdquo;</strong>
              </p>
              <p style={{ color: '#ccc', margin: 0 }}>
                3. Tap <strong style={{ color: '#fff' }}>&ldquo;Add&rdquo;</strong>
              </p>
            </div>
            <button
              onClick={() => setShowIOSModal(false)}
              aria-label="Close"
              style={{
                background: '#cc0000', color: '#fff',
                border: 'none', padding: '14px 40px',
                borderRadius: '999px', cursor: 'pointer',
                fontWeight: 700, fontSize: '16px', width: '100%',
              }}
            >
              Got it ✓
            </button>
          </div>
        </div>
      )}
    </>
  )
}
