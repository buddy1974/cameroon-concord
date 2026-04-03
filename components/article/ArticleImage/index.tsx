'use client'

interface Props {
  src: string
  alt: string
  caption?: string | null
}

export function ArticleImage({ src, alt, caption }: Props) {
  return (
    <figure className="mb-6">
      <div className="img-zoom w-full rounded-xl overflow-hidden bg-[#161616]">
        <img
          src={src}
          alt={alt}
          style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
          onError={e => { const fig = e.currentTarget.closest('figure'); if (fig) (fig as HTMLElement).style.display = 'none' }}
        />
      </div>
      {caption && (
        <figcaption className="text-xs text-[#6B7280] mt-2 text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
