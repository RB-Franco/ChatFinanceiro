"use client"

import { usePathname, useRouter } from "next/navigation"
import {
  BarChart3,
  Calendar,
  ChevronUp,
  Home,
  PanelLeft,
  PanelRight,
  User,
  Moon,
  Sun,
  Settings,
  Palette,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

// Adicionar os imports necessários para o dropdown
import { useProfile } from "@/components/profile/profile-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { signOut } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"

// Modificar a função MainSidebar para incluir o perfil
export function MainSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { state, toggleSidebar } = useSidebar()
  const { profile, loading: profileLoading, reloadProfile } = useProfile()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()

  // Necessário para evitar erro de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  // Efeito para recarregar o perfil quando o componente montar
  useEffect(() => {
    if (mounted && !profileLoading && !profile) {
      reloadProfile()
    }
  }, [mounted, profileLoading, profile, reloadProfile])

  // Adicione esta lógica para aplicar classes ao elemento body com base no estado do sidebar
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (state === "expanded") {
        document.body.classList.add("sidebar-expanded")
        document.body.classList.remove("sidebar-collapsed")
      } else {
        document.body.classList.add("sidebar-collapsed")
        document.body.classList.remove("sidebar-expanded")
      }
    }
  }, [state])

  const menuItems = [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard",
    },
    {
      title: "Relatórios",
      icon: BarChart3,
      href: "/reports",
    },
    {
      title: "Calendário",
      icon: Calendar,
      href: "/calendar",
    },
  ]

  const isCollapsed = state === "collapsed"

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

  // Função para alternar o tema
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Função para navegar para uma rota
  const navigateTo = (href: string) => {
    // Definir um cookie para manter a sessão durante a navegação
    document.cookie = "auth_session=true; path=/; max-age=3600" // 1 hora

    // Usar router.push para navegação do lado do cliente
    router.push(href)
  }

  // Renderizar um placeholder enquanto o perfil está carregando
  const renderProfilePlaceholder = () => (
    <div className="flex items-center">
      <div className="h-5 w-5 mr-2 bg-muted rounded-full animate-pulse"></div>
      {!isCollapsed && (
        <div className="flex items-center justify-between w-full">
          <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
          <Settings className="h-3.5 w-3.5 ml-2 text-muted-foreground" />
        </div>
      )}
    </div>
  )

  return (
    <Sidebar
      collapsible="icon"
      className="bg-[hsl(var(--sidebar-background))] dashboard-transition sidebar-container border-r shadow-sm"
    >
      <SidebarHeader className="py-4">
        <div className={`flex ${isCollapsed ? "justify-center" : "justify-between"} px-4 py-2`}>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            {!isCollapsed && <span className="text-xl font-bold text-primary">FinanceChat</span>}
          </div>
          {!isCollapsed && (
            <Button variant="ghost" size="sm" onClick={toggleSidebar} className="ml-2 hover:bg-muted/50">
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive = pathname === item.href

            return (
              <SidebarMenuItem key={item.href} className="my-1 dashboard-transition">
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.title}
                  onClick={() => !isActive && navigateTo(item.href)}
                  className={`
                   transition-all duration-200 rounded-lg
                   ${
                     isActive
                       ? "bg-primary/10 text-primary font-medium shadow-sm border border-primary/10"
                       : "hover:bg-muted/60 hover:text-foreground"
                   }
                 `}
                >
                  <div className="w-full flex items-center gap-3 py-1">
                    <item.icon className="h-5 w-5" />
                    <span className={`${isActive ? "text-primary font-medium" : ""}`}>{item.title}</span>
                    {isActive && !isCollapsed && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                    )}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-border/30 mt-auto py-4">
        <SidebarMenu>
          <SidebarMenuItem className="dashboard-transition my-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`w-full flex items-center p-2 rounded-lg hover:bg-muted/60 transition-colors ${
                    isCollapsed ? "justify-center" : "justify-between"
                  }`}
                >
                  <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
                    <Avatar className="h-6 w-6 border-2 border-primary/20">
                      <AvatarImage src={profile?.avatarUrl || ""} alt={profile?.name || "Usuário"} />
                      <AvatarFallback className="text-xs bg-primary/20 text-primary font-medium">
                        {profile?.name ? getInitials(profile.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <span className="truncate max-w-[120px] font-medium">{profile?.name || "Perfil"}</span>
                    )}
                  </div>
                  {!isCollapsed && <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 rounded-xl border border-border/50 shadow-lg"
                align="end"
                forceMount
                style={{ zIndex: 9999 }} // Garantir que o dropdown fique acima de tudo
              >
                <DropdownMenuLabel className="font-normal bg-muted/30 rounded-t-lg">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.name || "Usuário"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile?.email || "usuario@exemplo.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigateTo("/profile")}
                  className="focus:bg-primary/10 focus:text-primary rounded-md my-1 cursor-pointer"
                >
                  <User className="mr-3 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {mounted && (
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="focus:bg-primary/10 focus:text-primary rounded-md my-1"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center">
                        <Palette className="mr-3 h-4 w-4" />
                        <span>Tema</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-amber-500" />
                        <Switch
                          checked={theme === "dark"}
                          onCheckedChange={toggleTheme}
                          aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
                          className="data-[state=checked]:bg-primary"
                        />
                        <Moon className="h-4 w-4 text-indigo-400" />
                      </div>
                    </div>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/30 rounded-md my-1 cursor-pointer"
                  onClick={handleLogout}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                      <span>Saindo...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-3 h-4 w-4" />
                      <span>Sair</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
          {isCollapsed && (
            <SidebarMenuItem className="mt-4 dashboard-transition">
              <SidebarMenuButton
                onClick={toggleSidebar}
                tooltip="Expandir menu"
                className="w-full hover:bg-muted/60 rounded-lg"
              >
                <div className="w-full flex items-center gap-3 py-1">
                  <PanelRight className="h-5 w-5" />
                  <span>Expandir</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
