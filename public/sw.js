// Nome do cache
const CACHE_NAME = "finance-chat-v1"

// Recursos para cache
const STATIC_RESOURCES = [
  "/",
  "/dashboard",
  "/login",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/offline.html",
]

// Instalação
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando...")
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Cache aberto")
      return cache.addAll(STATIC_RESOURCES)
    }),
  )
})

// Ativação
self.addEventListener("activate", (event) => {
  console.log("[SW] Ativando...")

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

// Interceptar requisições
self.addEventListener("fetch", (event) => {
  // Estratégia simples: Cache com fallback para rede
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retornar do cache se disponível
      if (response) {
        return response
      }

      // Caso contrário, buscar da rede
      return fetch(event.request).catch(() => {
        // Se offline e for uma navegação, mostrar página offline
        if (event.request.mode === "navigate") {
          return caches.match("/offline.html")
        }
      })
    }),
  )
})
