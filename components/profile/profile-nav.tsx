"use client"

import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { signOut } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useProfile } from "./profile-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { PWAInstallButton } from "@/components/pwa-install-button"

export function ProfileNav() {
  const router = useRouter()
  const pathname = usePathname()
  const { profile, loading: profileLoading } = useProfile()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Função para gerar iniciais do nome
  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Função para limpar todos os cookies relacionados à autenticação
  const clearAuthCookies = () => {
    // Lista de cookies relacionados à autenticação para limpar
    const cookiesToClear = [
      "auth_login_success",
      "auth_session",
      "load_profile",
      "supabase-auth-token",
      "sb-access-token",
      "sb-refresh-token",
    ]

    // Limpar cada cookie definindo sua data de expiração no passado
    cookiesToClear.forEach((cookieName) => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict;`
    })
  }

  // Função para lidar com o logout
  const handleLogout = async () => {
    setLoading(true)

    try {
      // 1. Chamar o método de signOut do Supabase
      const { error } = await signOut()

      if (error) throw error

      // 2. Limpar todos os cookies relacionados à autenticação
      clearAuthCookies()

      // 3. Limpar dados de autenticação do localStorage
      localStorage.removeItem("supabase.auth.token")
      localStorage.removeItem("finance-user-profile")

      // 4. Limpar qualquer outro dado sensível do localStorage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes("auth") || key.includes("token") || key.includes("session"))) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach((key) => localStorage.removeItem(key))

      // 5. Limpar sessionStorage se necessário
      sessionStorage.clear()

      // 6. Redirecionar para a página de login
      // Usar um pequeno delay para garantir que tudo seja limpo antes do redirecionamento
      setTimeout(() => {
        router.push("/login")
      }, 100)
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message || "Ocorreu um erro ao desconectar da sua conta.",
        variant: "destructive",
      })

      // Mesmo com erro, tentar limpar os dados de sessão
      try {
        clearAuthCookies()
        localStorage.removeItem("finance-user-profile")
        localStorage.removeItem("supabase.auth.token")
      } catch (cleanupError) {
        console.error("Erro ao limpar dados de sessão:", cleanupError)
      }
    } finally {
      setLoading(false)
    }
  }

  // Renderizar um placeholder enquanto o perfil está carregando
  if (profileLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
        <div className="h-4 w-24 bg-muted rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <PWAInstallButton />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatarUrl || ""} alt={profile?.name || "Usuário"} />
              <AvatarFallback>{profile?.name ? getInitials(profile.name) : "U"}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile?.name || "Usuário"}</p>
              <p className="text-xs leading-none text-muted-foreground">{profile?.email || "usuario@exemplo.com"}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => router.push("/profile")}
            className={pathname === "/profile" ? "bg-muted" : ""}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Perfil</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Saindo...</span>
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
