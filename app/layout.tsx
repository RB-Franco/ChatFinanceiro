import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthCheck } from "@/components/auth/auth-check"
import { ConnectionStatus } from "@/components/connection-status"
import Script from "next/script"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Dashboard Financeiro",
  description: "Dashboard financeiro com chat integrado",
  manifest: "/manifest.json",
  themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
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
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FinanceChat" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="application-name" content="FinanceChat" />
      </head>
      <body className={`${inter.className}`}>
        <ErrorBoundary>
          <Providers>
            <AuthCheck redirectTo="/login">{children}</AuthCheck>
            <ConnectionStatus />
            <Toaster />
          </Providers>
        </ErrorBoundary>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            // Verificar se o Service Worker é suportado
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('Service Worker registrado com sucesso:', registration.scope);
                  })
                  .catch(function(error) {
                    console.log('Falha ao registrar o Service Worker:', error);
                  });
              });
            }
            
            // Verificar se o app está sendo executado como PWA
            if (window.matchMedia('(display-mode: standalone)').matches) {
              document.documentElement.classList.add('pwa-mode');
            }
            
            // Lidar com eventos de online/offline
            window.addEventListener('online', () => {
              document.documentElement.classList.remove('offline-mode');
            });
            
            window.addEventListener('offline', () => {
              document.documentElement.classList.add('offline-mode');
            });
            
            // Verificar se o app pode ser instalado
            window.addEventListener('beforeinstallprompt', (e) => {
              // Prevenir o comportamento padrão
              e.preventDefault();
              
              // Armazenar o evento para uso posterior
              window.deferredPrompt = e;
              
              // Mostrar o botão de instalação
              const installButtons = document.querySelectorAll('.install-pwa-button');
              installButtons.forEach(button => {
                button.style.display = 'block';
              });
              
              console.log('App pode ser instalado');
            });
          `}
        </Script>
      </body>
    </html>
  )
}
