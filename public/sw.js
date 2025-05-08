// Nome do cache
const CACHE_NAME = "finance-chat-v1"

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando...")
  self.skipWaiting()
})

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Ativando...")
  event.waitUntil(clients.claim())
})

// Evento fetch mínimo
self.addEventListener("fetch", (event) => {
  // Implementação mínima para garantir que o service worker seja reconhecido
  if (event.request.mode === "navigate" && !navigator.onLine) {
    event.respondWith(
      caches.match("/offline.html").then((response) => {
        return response || fetch(event.request)
      }),
    )
  }
})
