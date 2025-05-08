// Nome do cache
const CACHE_NAME = "finance-chat-v3"

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
  "/icons/icon-192x192-maskable.png",
  "/icons/icon-512x512-maskable.png",
]

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Cache aberto")
        return cache.addAll(STATIC_RESOURCES)
      })
      .then(() => self.skipWaiting()),
  )
})

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Limpando cache antigo:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Estratégia de cache melhorada
self.addEventListener("fetch", (event) => {
  // Ignorar requisições para API, autenticação e outros recursos específicos
  if (
    event.request.url.includes("supabase.co") ||
    event.request.method !== "GET" ||
    event.request.url.includes("/api/") ||
    event.request.url.includes("chrome-extension") ||
    event.request.url.includes("blob:") ||
    event.request.url.includes("/_next/")
  ) {
    return
  }

  // Estratégia Network First para navegação
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Não armazenar em cache redirecionamentos ou respostas de erro
          if (response.redirected || !response.ok) {
            return response
          }

          // Clonar a resposta para armazenar em cache
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Se a rede falhar, tente buscar do cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }

            // Para navegação, retorne a página offline
            return caches.match("/offline.html")
          })
        }),
    )
    return
  }

  // Estratégia Stale-While-Revalidate para recursos estáticos
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Retornar do cache imediatamente, enquanto busca atualização
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          // Não armazenar em cache redirecionamentos ou respostas de erro
          if (networkResponse.ok && !networkResponse.redirected) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }
          return networkResponse
        })
        .catch(() => {
          // Se a rede falhar, já temos a resposta do cache ou retornamos erro
          return new Response("Recurso não disponível offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          })
        })

      return cachedResponse || fetchPromise
    }),
  )
})

// Sincronização em segundo plano
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-transactions") {
    console.log("Sincronização de transações solicitada")
  }
})

// Lidar com notificações push
self.addEventListener("push", (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      body: data.body || "Nova notificação",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      data: {
        url: data.url || "/dashboard",
      },
    }

    event.waitUntil(self.registration.showNotification(data.title || "FinanceChat", options))
  } catch (error) {
    console.error("Erro ao processar notificação push:", error)
  }
})

// Lidar com cliques em notificações
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data && event.notification.data.url ? event.notification.data.url : "/dashboard"

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus()
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    }),
  )
})
