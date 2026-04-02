'use client'
import Link from 'next/link'
import { useEffect } from 'react'

export default function ArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Article error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl font-black text-[#C8102E] mb-4">500</div>
        <h2 className="text-xl font-bold text-white mb-3">Failed to load article</h2>
        <p className="text-[#555] text-sm mb-6">
          This article could not be loaded. Try reloading or go back to the homepage.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-[#C8102E] text-white text-sm font-semibold rounded-lg hover:bg-[#8B0000] transition-colors">
            Try Again
          </button>
          <Link href="/"
            className="px-5 py-2.5 bg-[#1A1A1A] text-white text-sm font-semibold rounded-lg hover:bg-[#222] transition-colors border border-[#2A2A2A]">
            Homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
