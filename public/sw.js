// Nome do cache
const CACHE_NAME = "finance-chat-v1"

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting()
  console.log("Service Worker instalado")
})

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
  console.log("Service Worker ativado")
})

// Evento fetch básico
self.addEventListener("fetch", (event) => {
  // Implementação mínima para garantir que o service worker seja reconhecido
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline.html")
      }),
    )
  }
})
