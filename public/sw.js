// Nome do cache
const CACHE_NAME = "finance-chat-v1"

// Lista de recursos para cache
const STATIC_RESOURCES = [
  "/",
  "/dashboard",
  "/reports",
  "/calendar",
  "/profile",
  "/manifest.json",
  "/favicon.ico",
  "/offline.html",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Instalando...")

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Cache aberto")
        return cache.addAll(STATIC_RESOURCES)
      })
      .then(() => self.skipWaiting()),
  )
})

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Ativando...")

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[Service Worker] Limpando cache antigo:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Estratégia de cache simples
self.addEventListener("fetch", (event) => {
  // Ignorar requisições para API e outros recursos específicos
  if (
    event.request.url.includes("supabase.co") ||
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("chrome-extension") ||
    event.request.url.includes("blob:")
  ) {
    return
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        // Para navegação, retorne a página offline
        if (event.request.mode === "navigate") {
          return caches.match("/offline.html")
        }

        return new Response("Recurso não disponível offline", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        })
      })
    }),
  )
})
