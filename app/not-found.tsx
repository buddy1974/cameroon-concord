import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-[#C8102E] mb-4">404</div>
        <h1 className="text-2xl font-bold text-white mb-3">Page Not Found</h1>
        <p className="text-[#6B7280] mb-8 text-sm leading-relaxed">
          The article or page you are looking for may have been moved or no longer exists.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#C8102E] text-white font-semibold px-6 py-3 rounded-lg hover:bg-[#8B0000] transition-colors text-sm"
        >
          Back to Homepage
        </Link>
      </div>
    </div>
  )
}
