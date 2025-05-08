// Service Worker mínimo
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener("fetch", (event) => {
  // Implementação mínima para garantir que o service worker seja reconhecido
})
