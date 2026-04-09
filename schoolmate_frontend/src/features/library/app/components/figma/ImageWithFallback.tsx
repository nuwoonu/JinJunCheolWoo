import React, { useState } from 'react'

function BookPlaceholder({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-linear-to-br from-gray-200 to-gray-300 ${className ?? ''}`}
      style={style}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    </div>
  )
}

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)
  const { src, alt, style, className, ...rest } = props

  if (!src || didError) {
    return <BookPlaceholder className={`w-full h-full ${className ?? ''}`} style={style} />
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={() => setDidError(true)}
    />
  )
}
