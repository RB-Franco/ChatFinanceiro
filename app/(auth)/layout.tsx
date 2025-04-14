import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../../globals.css"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { AuthBackground } from "@/components/auth/auth-background"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Autenticação | FinanceChat",
  description: "Entre ou cadastre-se no FinanceChat",
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen h-screen flex flex-col w-full relative overflow-hidden bg-white dark:bg-gray-950">
            <AuthBackground />
            <div className="relative z-10 flex-1 flex items-center justify-center">
              <div className="w-full max-w-md px-4">{children}</div>
            </div>
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
