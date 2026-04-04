'use client'
import Script from 'next/script'
import { usePathname } from 'next/navigation'

export default function AdSenseLoader() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null
  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-0554291063972402"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}
