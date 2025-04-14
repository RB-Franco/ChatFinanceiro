"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { FinanceProvider } from "@/components/finance-provider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ProfileProvider } from "@/components/profile/profile-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { usePathname } from "next/navigation"

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Verificar se estamos em uma rota de autenticação
  const isAuthRoute = ["/login", "/register", "/forgot-password", "/reset-password"].some((route) => pathname === route)

  // Para rotas de autenticação, não usar ProfileProvider e FinanceProvider
  // Isso evita problemas de autenticação nessas páginas
  if (isAuthRoute) {
    return (
      <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    )
  }

  // Para outras rotas, usar todos os providers
  return (
    <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
      <TooltipProvider>
        <ProfileProvider>
          <FinanceProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </FinanceProvider>
        </ProfileProvider>
      </TooltipProvider>
    </ThemeProvider>
  )
}
