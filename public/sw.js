const CACHE_NAME = "finance-dashboard-v1"

// Recursos que queremos armazenar em cache
const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/calendar",
  "/reports",
  "/profile",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-384x384.png",
  "/icons/icon-512x512.png",
]

// Instalação do Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

// Ativação do Service Worker
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName)
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

// Estratégia de cache: Network First com fallback para cache
self.addEventListener("fetch", (event) => {
  // Ignorar requisições para Supabase e outras APIs
  if (
    event.request.url.includes("supabase.co") ||
    event.request.url.includes("googleapis.com") ||
    event.request.method !== "GET"
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta for válida, clone-a e armazene-a no cache
        if (response && response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Se a rede falhar, tente buscar do cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }

          // Para navegação, retorne a página offline
          if (event.request.mode === "navigate") {
            return caches.match("/")
          }

          return new Response("Não foi possível carregar o recurso", {
            status: 408,
            headers: { "Content-Type": "text/plain" },
          })
        })
      }),
  )
})

// Sincronização em segundo plano
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-transactions") {
    event.waitUntil(syncTransactions())
  }
})

// Função para sincronizar transações armazenadas localmente
async function syncTransactions() {
  try {
    // Simulação de sincronização bem-sucedida
    return true
  } catch (error) {
    return false
  }
}
