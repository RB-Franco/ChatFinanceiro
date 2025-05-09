// Nome do cache
const CACHE_NAME = "finance-chat-v1"

// Lista de recursos essenciais para cache
const STATIC_RESOURCES = [
  "/",
  "/login",
  "/dashboard",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando...")

  // Força a ativação imediata
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Cache aberto")
      return cache.addAll(STATIC_RESOURCES)
    }),
  )
})

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Ativando...")

  // Força o controle imediato de todas as páginas
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Limpar caches antigos
      caches
        .keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== CACHE_NAME) {
                console.log("[SW] Limpando cache antigo:", cacheName)
                return caches.delete(cacheName)
              }
            }),
          )
        }),
    ]),
  )
})

// Evento fetch básico mas essencial
self.addEventListener("fetch", (event) => {
  // Implementação simples para garantir que o service worker seja reconhecido
  if (event.request.mode === "navigate" && !navigator.onLine) {
    event.respondWith(
      caches.match("/offline.html").then((response) => {
        return response || fetch(event.request)
      }),
    )
  }
})
