"use client"

import { useEffect, useState } from "react"

export function ForceSWActivation() {
  const [status, setStatus] = useState("verificando")

  useEffect(() => {
    async function activateSW() {
      if (!("serviceWorker" in navigator)) {
        setStatus("não suportado")
        return
      }

      try {
        // Remover service workers antigos
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
          console.log("[PWA] Service Worker removido:", registration.scope)
        }

        // Limpar caches
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
        console.log("[PWA] Caches limpos")

        // Registrar novo service worker
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
        console.log("[PWA] Service Worker registrado:", registration.scope)

        // Forçar ativação
        if (registration.installing) {
          console.log("[PWA] Service Worker instalando")
          registration.installing.addEventListener("statechange", (e) => {
            const sw = e.target as ServiceWorker
            console.log("[PWA] Service Worker mudou para estado:", sw.state)
            if (sw.state === "activated") {
              setStatus("ativo")
              window.location.reload()
            }
          })
        } else if (registration.waiting) {
          console.log("[PWA] Service Worker esperando")
          registration.waiting.postMessage({ type: "SKIP_WAITING" })
          setStatus("ativando")
        } else if (registration.active) {
          console.log("[PWA] Service Worker já ativo")
          registration.active.postMessage({ type: "CLAIM_CLIENTS" })
          setStatus("ativo")
        }
      } catch (error) {
        console.error("[PWA] Erro ao ativar Service Worker:", error)
        setStatus("erro")
      }
    }

    activateSW()
  }, [])

  // Componente invisível, apenas para lógica
  return null
}
