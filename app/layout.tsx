import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthCheck } from "@/components/auth/auth-check"
import { ConnectionStatus } from "@/components/connection-status"
import { PWAManager } from "@/components/pwa-manager"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Dashboard Financeiro",
  description: "Dashboard financeiro com chat integrado",
  manifest: "/manifest.json",
  themeColor: "#0EA5E9",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FinanceChat",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/apple-icon-180.png",
  },
  formatDetection: {
    telephone: false,
  },
  applicationName: "FinanceChat",
  appleWebAppCapable: "yes",
  appleWebAppStatusBarStyle: "black-translucent",
  appleWebAppTitle: "FinanceChat",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FinanceChat" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0EA5E9" />

        {/* Splash screens para iOS */}
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-2048-2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1668-2388.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1536-2048.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1125-2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1242-2688.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-828-1792.png"
          media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-1242-2208.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-750-1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/icons/apple-splash-640-1136.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <AuthCheck redirectTo="/login">{children}</AuthCheck>
            <ConnectionStatus />
            <PWAManager />
            <Toaster />
          </Providers>
        </ErrorBoundary>

        {/* Service Worker Inline */}
        <Script id="inline-sw" strategy="beforeInteractive">
          {`
            // Verificar se o Service Worker é suportado
            if ('serviceWorker' in navigator) {
              // Criar um service worker inline usando Blob
              const swContent = \`
                // Nome do cache
                const CACHE_NAME = "finance-chat-v1";
                
                // Lista de recursos para cache
                const STATIC_RESOURCES = [
                  "/",
                  "/login",
                  "/dashboard",
                  "/manifest.json",
                  "/icons/icon-192x192.png",
                  "/icons/icon-512x512.png"
                ];
                
                // Instalação do Service Worker
                self.addEventListener("install", (event) => {
                  console.log("[SW] Instalando...");
                  self.skipWaiting();
                  
                  event.waitUntil(
                    caches.open(CACHE_NAME)
                      .then((cache) => {
                        console.log("[SW] Cache aberto");
                        return cache.addAll(STATIC_RESOURCES);
                      })
                  );
                });
                
                // Ativação do Service Worker
                self.addEventListener("activate", (event) => {
                  console.log("[SW] Ativando...");
                  
                  event.waitUntil(
                    Promise.all([
                      self.clients.claim(),
                      
                      // Limpar caches antigos
                      caches.keys().then((cacheNames) => {
                        return Promise.all(
                          cacheNames.map((cacheName) => {
                            if (cacheName !== CACHE_NAME) {
                              console.log("[SW] Limpando cache antigo:", cacheName);
                              return caches.delete(cacheName);
                            }
                          })
                        );
                      })
                    ])
                  );
                  
                  return self.clients.claim();
                });
                
                // Evento fetch básico
                self.addEventListener("fetch", (event) => {
                  // Implementação mínima para garantir que o service worker seja reconhecido
                  if (event.request.mode === "navigate" && !navigator.onLine) {
                    event.respondWith(
                      caches.match("/offline.html").then(response => {
                        return response || fetch(event.request);
                      })
                    );
                  }
                });
              \`;
              
              // Criar um Blob com o conteúdo do service worker
              const blob = new Blob([swContent], { type: 'application/javascript' });
              const swUrl = URL.createObjectURL(blob);
              
              // Registrar o service worker usando o URL do Blob
              navigator.serviceWorker.register(swUrl, { scope: '/' })
                .then(function(registration) {
                  console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);
                  
                  // Verificar se o service worker está ativo
                  if (registration.active) {
                    console.log('[PWA] Service Worker já está ativo');
                  }
                  
                  // Monitorar mudanças de estado
                  registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                      newWorker.addEventListener('statechange', () => {
                        console.log('[PWA] Service Worker state changed:', newWorker.state);
                      });
                    }
                  });
                  
                  // Verificar se há um service worker esperando
                  if (registration.waiting) {
                    console.log('[PWA] Service Worker esperando para ativar');
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                  }
                })
                .catch(function(error) {
                  console.error('[PWA] Falha ao registrar o Service Worker:', error);
                });
              
              // Capturar o evento beforeinstallprompt
              window.addEventListener('beforeinstallprompt', function(e) {
                console.log('[PWA] Evento beforeinstallprompt capturado');
                e.preventDefault();
                window.deferredPrompt = e;
                window.dispatchEvent(new CustomEvent('pwaInstallable', { detail: e }));
              });
              
              // Verificar se já está instalado
              window.addEventListener('appinstalled', function(e) {
                console.log('[PWA] Aplicativo instalado com sucesso');
                window.deferredPrompt = null;
                localStorage.setItem('pwa-installed', 'true');
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
