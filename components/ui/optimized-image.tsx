"use client"

import { useState } from "react"
import Image from "next/image"

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
}

export function OptimizedImage({ src, alt, width, height, className, priority = false }: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false)

  // Handle image load event
  const handleLoad = () => {
    setLoaded(true)
  }

  return (
    <div className={`relative ${className || ""}`} style={{ width, height }}>
      {!loaded && <div className="absolute inset-0 bg-muted animate-pulse rounded-md" style={{ width, height }} />}
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        className={`${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
        onLoad={handleLoad}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  )
}
