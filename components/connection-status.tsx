"use client"

import { useEffect, useState } from "react"

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Definir estado inicial
    setIsOnline(navigator.onLine)

    // Adicionar event listeners
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (typeof window === "undefined") return null

  return (
    <div
      id="connection-status"
      className={`fixed bottom-4 right-4 z-50 px-3 py-1 text-xs font-medium text-white rounded-full transition-all duration-300 ${
        isOnline ? "bg-green-500" : "bg-red-500"
      }`}
    >
      {isOnline ? "Online" : "Offline"}
    </div>
  )
}
