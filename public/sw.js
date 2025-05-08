// Nome do cache
const CACHE_NAME = "finance-chat-v4"
const APP_VERSION = "1.0.0"

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
  "/icons/icon-72x72.png",
  "/icons/icon-96x96.png",
  "/icons/icon-128x128.png",
  "/icons/icon-144x144.png",
  "/icons/icon-152x152.png",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
  "/icons/maskable-icon-192x192.png",
  "/icons/maskable-icon-512x512.png",
  "/icons/apple-icon-180.png",
]

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Instalando...", APP_VERSION)

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Cache aberto")
        return cache.addAll(STATIC_RESOURCES)
      })
      .then(() => {
        console.log("[Service Worker] Recursos em cache adicionados")
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error("[Service Worker] Erro ao adicionar recursos em cache:", error)
      }),
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
      .then(() => {
        console.log("[Service Worker] Agora está ativo e controlando a página")
        return self.clients.claim()
      })
      .catch((error) => {
        console.error("[Service Worker] Erro ao ativar:", error)
      }),
  )
})

// Estratégia de cache melhorada
self.addEventListener("fetch", (event) => {
  // Log para depuração
  // console.log("[Service Worker] Fetch:", event.request.url)

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
  console.log("[Service Worker] Sync evento:", event.tag)

  if (event.tag === "sync-transactions") {
    console.log("[Service Worker] Sincronização de transações solicitada")
  }
})

// Lidar com notificações push
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push recebido:", event)

  if (!event.data) return

  try {
    const data = event.data.json()

    const options = {
      body: data.body || "Nova notificação",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      data: {
        url: data.url || "/dashboard",
      },
    }

    event.waitUntil(self.registration.showNotification(data.title || "FinanceChat", options))
  } catch (error) {
    console.error("[Service Worker] Erro ao processar notificação push:", error)
  }
})

// Lidar com cliques em notificações
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notificação clicada:", event.notification.tag)

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

// Mensagens do cliente
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Mensagem recebida:", event.data)

  if (event.data === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
