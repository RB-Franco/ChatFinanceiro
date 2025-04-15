"use client"

import type React from "react"
import { useEffect, useState, useCallback } from "react"
import { getSupabase } from "@/lib/supabase"
import { useRouter, usePathname } from "next/navigation"
import { LoadingOverlay } from "@/components/loading-overlay"
import type { AuthChangeEvent, Session } from "@supabase/supabase-js"

interface AuthCheckProps {
  children: React.ReactNode
  redirectTo?: string
}

export function AuthCheck({ children, redirectTo = "/login" }: AuthCheckProps) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabase()

  // Verificar se estamos em uma rota de autenticação
  const isAuthRoute = ["/login", "/register", "/forgot-password", "/reset-password"].some((route) => pathname === route)

  // Verificar se há um cookie de login bem-sucedido
  const checkLoginSuccessCookie = useCallback(() => {
    if (typeof document === "undefined") return false
    const cookies = document.cookie.split(";")
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.startsWith("auth_login_success=true")) {
        return true
      }
    }
    return false
  }, [])

  // Modificar a função checkAuth para melhorar a verificação de autenticação
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true)

      // Verificar se há um cookie de login bem-sucedido
      const isLoginSuccess = checkLoginSuccessCookie()
      if (isLoginSuccess) {
        setAuthenticated(true)
        setLoading(false)
        return
      }

      // Verificar se há um cookie de sessão temporária
      const hasTempSession = document.cookie.includes("auth_session=true")
      if (hasTempSession) {
        setAuthenticated(true)
        setLoading(false)
        return
      }

      // Verificar se estamos em modo de desenvolvimento com bypass ativado
      if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
        setAuthenticated(true)
        setLoading(false)
        return
      }

      // Verificar se o usuário está autenticado
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // Definir um cookie para manter a sessão durante navegações
        document.cookie = "auth_session=true; path=/; max-age=3600" // 1 hora
        setAuthenticated(true)
      } else {
        setAuthenticated(false)

        // Se não estamos em uma rota de autenticação, redirecionar para o login
        if (!isAuthRoute && redirectTo) {
          router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`)
        }
      }
    } catch (error) {
      setAuthenticated(false)

      // Se não estamos em uma rota de autenticação, redirecionar para o login
      if (!isAuthRoute && redirectTo) {
        router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`)
      }
    } finally {
      setLoading(false)
    }
  }, [supabase, redirectTo, pathname, isAuthRoute, router, checkLoginSuccessCookie])

  useEffect(() => {
    // Se estamos em uma rota de autenticação, não verificar autenticação
    if (isAuthRoute) {
      setLoading(false)
      setAuthenticated(true)
      return
    }

    // Usar um único checkAuth inicial
    checkAuth()

    // Configurar listener para mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === "SIGNED_IN" && session) {
          setAuthenticated(true)
          // Não chamar checkAuth() novamente aqui
        } else if (event === "SIGNED_OUT") {
          setAuthenticated(false)

          // Se não estamos em uma rota de autenticação, redirecionar para o login
          if (!isAuthRoute && redirectTo) {
            router.push(redirectTo)
          }
        }
      },
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, redirectTo, supabase, pathname, isAuthRoute, checkAuth])

  if (loading) {
    return <LoadingOverlay show={true} message="Verificando autenticação..." />
  }

  if (!authenticated && !isAuthRoute) {
    return null
  }

  return <>{children}</>
}
