import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { ErrorBoundary } from "@/components/error-boundary"
import { AuthCheck } from "@/components/auth/auth-check"
import { ConnectionStatus } from "@/components/connection-status"
import { PWAInstallButton } from "@/components/pwa-install-button"
import { PWADebug } from "@/components/pwa-debug"
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
        <link rel="icon" href="/icons/icon-192x192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/apple-icon-180.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            <AuthCheck redirectTo="/login">{children}</AuthCheck>
            <ConnectionStatus />
            <PWAInstallButton />
            <PWADebug />
            <Toaster />
          </Providers>
        </ErrorBoundary>
        <Script id="register-sw" src="/register-sw.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}
