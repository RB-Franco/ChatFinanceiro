"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

export function PWADebugOverlay() {
  const [isOpen, setIsOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const gatherDebugInfo = () => {
      const info = {
        userAgent: navigator.userAgent,
        standalone: (window.navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches,
        serviceWorker: "serviceWorker" in navigator,
        online: navigator.onLine,
        platform: navigator.platform,
        manifestLink: !!document.querySelector('link[rel="manifest"]'),
        hasBeforeInstallPrompt: false,
        display: window.innerWidth + "x" + window.innerHeight,
      }

      setDebugInfo(info)
    }

    gatherDebugInfo()

    // Atualizar quando o evento beforeinstallprompt for disparado
    const handleBeforeInstallPrompt = () => {
      setDebugInfo((prev) => ({ ...prev, hasBeforeInstallPrompt: true }))
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-full opacity-50 hover:opacity-100"
        aria-label="Debug PWA"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
          <path d="M12 16v.01"></path>
          <path d="M12 8v4"></path>
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">PWA Debug Info</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          {Object.entries(debugInfo).map(([key, value]) => (
            <div key={key} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
              <span className="font-medium">{key}:</span>
              <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={() => {
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  for (const registration of registrations) {
                    registration.unregister()
                  }
                  alert("Service Workers removidos. Recarregue a página.")
                })
              }
            }}
            className="w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Remover Service Workers
          </button>

          <button
            onClick={() => {
              caches
                .keys()
                .then((cacheNames) => {
                  return Promise.all(
                    cacheNames.map((cacheName) => {
                      return caches.delete(cacheName)
                    }),
                  )
                })
                .then(() => {
                  alert("Cache limpo. Recarregue a página.")
                })
            }}
            className="w-full py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Limpar Cache
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    </div>
  )
}
