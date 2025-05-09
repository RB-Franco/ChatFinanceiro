// Nome do cache
const CACHE_NAME = "finance-chat-v1"

// Lista de recursos para cache
const STATIC_RESOURCES = [
  "/",
  "/login",
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
  console.log("[ServiceWorker] Install")

  // Força a ativação imediata
  self.skipWaiting()

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[ServiceWorker] Caching app shell")
      return cache.addAll(STATIC_RESOURCES)
    }),
  )
})

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  console.log("[ServiceWorker] Activate")

  // Força o controle imediato de todas as páginas
  event.waitUntil(
    Promise.all([
      self.clients.claim(),

      // Limpar caches antigos
      caches
        .keys()
        .then((keyList) => {
          return Promise.all(
            keyList.map((key) => {
              if (key !== CACHE_NAME) {
                console.log("[ServiceWorker] Removing old cache", key)
                return caches.delete(key)
              }
            }),
          )
        }),
    ]),
  )

  // Notificar todos os clientes que o service worker foi ativado
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "SW_ACTIVATED",
        timestamp: new Date().getTime(),
      })
    })
  })

  return self.clients.claim()
})

// Estratégia de cache
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

  // Estratégia Network First para navegação
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clonar a resposta para armazenar em cache
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            return caches.match("/offline.html")
          })
        }),
    )
    return
  }

  // Estratégia Cache First para recursos estáticos
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Atualizar o cache em segundo plano
        fetch(event.request)
          .then((response) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone())
            })
          })
          .catch(() => {})

        return cachedResponse
      }

      return fetch(event.request)
        .then((response) => {
          // Clonar a resposta para armazenar em cache
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
          return response
        })
        .catch(() => {
          // Retornar resposta padrão para imagens e outros recursos
          if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
            return new Response("", {
              status: 404,
              statusText: "Not found",
            })
          }
        })
    }),
  )
})

// Lidar com mensagens dos clientes
self.addEventListener("message", (event) => {
  console.log("[ServiceWorker] Message received:", event.data)

  if (event.data === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
