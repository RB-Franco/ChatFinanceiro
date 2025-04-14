"use client"

import { useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { LoadingOverlay } from "./loading-overlay"

export function RouteTransition() {
  const [isLoading, setIsLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (typeof window === "undefined") return

    let timeoutId: NodeJS.Timeout
    let transitionTimeoutId: NodeJS.Timeout

    const handleStart = () => {
      // Clear any existing timeout
      if (timeoutId) clearTimeout(timeoutId)
      if (transitionTimeoutId) clearTimeout(transitionTimeoutId)

      setIsTransitioning(true)
      // Pequeno delay antes de mostrar o loading para evitar flash em transições rápidas
      timeoutId = setTimeout(() => {
        setIsLoading(true)
      }, 150)
    }

    const handleComplete = () => {
      // Use a small delay to prevent flashing
      timeoutId = setTimeout(() => {
        setIsLoading(false)

        // Manter o estado de transição por um tempo adicional para permitir animações de entrada
        transitionTimeoutId = setTimeout(() => {
          setIsTransitioning(false)
        }, 500)
      }, 100)
    }

    // For Next.js App Router
    const handleRouteChangeStart = () => handleStart()
    const handleRouteChangeComplete = () => handleComplete()
    const handleRouteChangeError = () => handleComplete()

    // For browser navigation
    window.addEventListener("beforeunload", handleStart)

    // Create a custom event system for route changes
    window.__NEXT_ROUTER_EVENTS = window.__NEXT_ROUTER_EVENTS || {
      emit: (type: string) => {
        window.dispatchEvent(new CustomEvent(`next-router:${type}`))
      },
    }

    window.addEventListener("next-router:routeChangeStart", handleRouteChangeStart)
    window.addEventListener("next-router:routeChangeComplete", handleRouteChangeComplete)
    window.addEventListener("next-router:routeChangeError", handleRouteChangeError)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      if (transitionTimeoutId) clearTimeout(transitionTimeoutId)
      window.removeEventListener("beforeunload", handleStart)
      window.removeEventListener("next-router:routeChangeStart", handleRouteChangeStart)
      window.removeEventListener("next-router:routeChangeComplete", handleRouteChangeComplete)
      window.removeEventListener("next-router:routeChangeError", handleRouteChangeError)
    }
  }, [])

  // Reset loading state when the route changes
  useEffect(() => {
    setIsLoading(false)

    // Manter o estado de transição por um tempo adicional para permitir animações de entrada
    const timeoutId = setTimeout(() => {
      setIsTransitioning(false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [pathname, searchParams])

  return (
    <>
      <LoadingOverlay
        show={isLoading}
        fullScreen={false}
        className="content-loading-overlay"
        message="Carregando página..."
      />
      {isTransitioning && <div className="fixed inset-0 bg-background z-[60] page-transition-overlay" />}
    </>
  )
}

// Add this to the global Window interface
declare global {
  interface Window {
    __NEXT_ROUTER_EVENTS?: {
      emit: (type: string) => void
    }
  }
}
