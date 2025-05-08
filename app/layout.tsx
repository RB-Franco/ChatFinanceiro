import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthCheck } from "@/components/auth/auth-check"
import { ConnectionStatus } from "@/components/connection-status"
import { PWAInstallModal } from "@/components/pwa-install-modal"
import { PWADiagnostics } from "@/components/pwa-diagnostics"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Dashboard Financeiro",
  description: "Dashboard financeiro com chat integrado",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dashboard Financeiro",
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
        <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FinanceChat" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="application-name" content="FinanceChat" />

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
            <PWAInstallModal />
            <PWADiagnostics />
            <Toaster />
          </Providers>
        </ErrorBoundary>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            // Verificar se o Service Worker é suportado
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', async function() {
                try {
                  console.log('[PWA] Registrando Service Worker...');
                  const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                  });
                  console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);
                  
                  // Verificar se há atualizações
                  registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('[PWA] Nova versão do Service Worker encontrada:', newWorker);
                    
                    newWorker.addEventListener('statechange', () => {
                      console.log('[PWA] Estado do Service Worker alterado:', newWorker.state);
                    });
                  });
                  
                  // Verificar se há um service worker esperando
                  if (registration.waiting) {
                    console.log('[PWA] Service Worker esperando para ativar');
                  }
                  
                } catch (error) {
                  console.error('[PWA] Falha ao registrar o Service Worker:', error);
                }
              });
              
              // Verificar se há atualizações quando a página fica visível
              document.addEventListener('visibilitychange', async () => {
                if (document.visibilityState === 'visible') {
                  const registrations = await navigator.serviceWorker.getRegistrations();
                  for (const registration of registrations) {
                    registration.update();
                  }
                }
              });
            } else {
              console.warn('[PWA] Service Workers não são suportados neste navegador');
            }
            
            // Variável global para armazenar o evento beforeinstallprompt
            window.deferredPrompt = null;
            
            // Verificar se o app está sendo executado como PWA
            if (window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator.standalone === true)) {
              document.documentElement.classList.add('pwa-mode');
              console.log('[PWA] Aplicativo está sendo executado como PWA');
            }
            
            // Lidar com eventos de online/offline
            window.addEventListener('online', () => {
              document.documentElement.classList.remove('offline-mode');
              console.log('[PWA] Aplicativo está online');
            });
            
            window.addEventListener('offline', () => {
              document.documentElement.classList.add('offline-mode');
              console.log('[PWA] Aplicativo está offline');
            });
            
            // Verificar se o app pode ser instalado
            window.addEventListener('beforeinstallprompt', (e) => {
              // Prevenir o comportamento padrão
              e.preventDefault();
              
              // Armazenar o evento para uso posterior
              window.deferredPrompt = e;
              
              console.log('[PWA] App pode ser instalado - evento beforeinstallprompt capturado');
              
              // Disparar um evento personalizado para notificar componentes
              const event = new CustomEvent('pwaInstallable', { detail: e });
              window.dispatchEvent(event);
            });
            
            // Verificar se já está instalado
            window.addEventListener('appinstalled', (e) => {
              console.log('[PWA] Aplicativo instalado com sucesso');
              window.deferredPrompt = null;
              
              // Disparar um evento personalizado
              const event = new CustomEvent('pwaInstalled');
              window.dispatchEvent(event);
            });
          `}
        </Script>
        <Script id="pwa-check" src="/pwa-check.js" strategy="lazyOnload" />
      </body>
    </html>
  )
}
