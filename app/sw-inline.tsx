export default function SwInline() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          // Verificar se o Service Worker é suportado
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
              .then(function(registration) {
                console.log('Service Worker registrado com sucesso:', registration.scope);
              })
              .catch(function(error) {
                console.error('Falha ao registrar o Service Worker:', error);
                
                // Fallback: registrar um service worker inline mínimo
                const swData = new Blob([
                  \`
                  self.addEventListener('install', event => {
                    self.skipWaiting();
                  });
                  
                  self.addEventListener('activate', event => {
                    event.waitUntil(self.clients.claim());
                  });
                  
                  self.addEventListener('fetch', event => {
                    if (event.request.mode === 'navigate' && !navigator.onLine) {
                      event.respondWith(
                        caches.match('/offline.html')
                          .then(response => {
                            return response || fetch(event.request);
                          })
                      );
                    }
                  });
                  \`
                ], {type: 'application/javascript'});
                
                const swUrl = URL.createObjectURL(swData);
                
                navigator.serviceWorker.register(swUrl, {scope: '/'})
                  .then(function(registration) {
                    console.log('Service Worker inline registrado com sucesso:', registration.scope);
                  })
                  .catch(function(error) {
                    console.error('Falha ao registrar o Service Worker inline:', error);
                  });
              });
          }
        `,
      }}
    />
  )
}
