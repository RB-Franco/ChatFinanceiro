import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthCheck } from "@/components/auth/auth-check"
import { ConnectionStatus } from "@/components/connection-status"
import { PWAAdvancedDebug } from "@/components/pwa-advanced-debug"
import { PWAMiniInfobar } from "@/components/pwa-mini-infobar"
import { PWAInstallGuide } from "@/components/pwa-install-guide"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Dashboard Financeiro",
  description: "Dashboard financeiro com chat integrado",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
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
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FinanceChat" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <AuthCheck redirectTo="/login">{children}</AuthCheck>
            <ConnectionStatus />
            <PWAMiniInfobar />
            <PWAInstallGuide />
            <PWAAdvancedDebug />
            <Toaster />
          </Providers>
        </ErrorBoundary>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('[PWA] Service Worker registrado com sucesso:', registration.scope);
                  })
                  .catch(function(error) {
                    console.error('[PWA] Falha ao registrar o Service Worker:', error);
                  });
              });
            }
            
            // Verificar se o app está sendo executado como PWA
            if (window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator.standalone === true)) {
              document.documentElement.classList.add('pwa-mode');
              console.log('[PWA] Aplicativo está sendo executado como PWA');
            }
            
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
          `}
        </Script>
      </body>
    </html>
  )
}
