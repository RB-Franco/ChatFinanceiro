"use client"

import { useEffect, useState } from "react"

export function PWADebug() {
  const [debug, setDebug] = useState({
    isHttps: false,
    hasManifest: false,
    hasServiceWorker: false,
    isStandalone: false,
    hasBeforeInstallPrompt: false,
    userAgent: "",
    errors: [] as string[],
  })

  useEffect(() => {
    const errors: string[] = []

    // Verificar HTTPS
    const isHttps = window.location.protocol === "https:"
    if (!isHttps && window.location.hostname !== "localhost") {
      errors.push("Não está usando HTTPS")
    }

    // Verificar manifesto
    const hasManifest = !!document.querySelector('link[rel="manifest"]')
    if (!hasManifest) {
      errors.push("Manifesto não encontrado")
    }

    // Verificar Service Worker
    const hasServiceWorker = "serviceWorker" in navigator
    if (!hasServiceWorker) {
      errors.push("Service Worker não suportado")
    }

    // Verificar modo standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true

    // Verificar evento beforeinstallprompt
    const hasBeforeInstallPrompt = !!window.deferredPrompt

    setDebug({
      isHttps,
      hasManifest,
      hasServiceWorker,
      isStandalone,
      hasBeforeInstallPrompt,
      userAgent: navigator.userAgent,
      errors,
    })

    // Adicionar listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = () => {
      setDebug((prev) => ({ ...prev, hasBeforeInstallPrompt: true }))
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  // Não mostrar em produção
  if (process.env.NODE_ENV === "production") {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 z-50 text-xs">
      <h3 className="font-bold mb-2">PWA Debug</h3>

      <div className="grid grid-cols-2 gap-2">
        <div>HTTPS: {debug.isHttps ? "✅" : "❌"}</div>
        <div>Manifesto: {debug.hasManifest ? "✅" : "❌"}</div>
        <div>Service Worker: {debug.hasServiceWorker ? "✅" : "❌"}</div>
        <div>Standalone: {debug.isStandalone ? "✅" : "❌"}</div>
        <div>BeforeInstallPrompt: {debug.hasBeforeInstallPrompt ? "✅" : "❌"}</div>
      </div>

      {debug.errors.length > 0 && (
        <div className="mt-2">
          <div className="font-bold text-red-500">Erros:</div>
          <ul className="list-disc pl-5">
            {debug.errors.map((error, i) => (
              <li key={i} className="text-red-500">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-2 text-xs overflow-hidden text-ellipsis">
        <div className="font-bold">User Agent:</div>
        <div className="truncate">{debug.userAgent}</div>
      </div>

      <button
        className="mt-2 px-2 py-1 bg-blue-500 text-white rounded text-xs"
        onClick={() => {
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
              for (const registration of registrations) {
                registration.unregister()
              }
              window.location.reload()
            })
          }
        }}
      >
        Remover Service Worker e Recarregar
      </button>
    </div>
  )
}
