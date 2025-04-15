"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getSupabase, isRLSError, isSessionMissingError } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import type { AuthChangeEvent } from "@supabase/supabase-js"

// Tipo para o perfil do usuário
export interface UserProfile {
  id?: string
  name: string
  email: string
  avatarUrl?: string
  familyCode?: string
  associatedFamilyCode?: string
  countryCode?: string
  currency?: string
  showCents?: boolean
  budgetAlerts?: boolean
  monthlyBudget?: number
}

// Contexto para o perfil
interface ProfileContextType {
  profile: UserProfile | null
  updateProfile: (profile: UserProfile) => Promise<void>
  loading: boolean
  error: Error | null
  isAuthenticated: boolean
  reloadProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

// Chave para armazenar o perfil no localStorage como fallback
const STORAGE_KEY = "finance-user-profile"

// Verificar se há um cookie de login bem-sucedido
const checkLoginSuccessCookie = () => {
  if (typeof document === "undefined") return false
  const cookies = document.cookie.split(";")
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    if (cookie.startsWith("auth_login_success=true")) {
      return true
    }
  }
  return false
}

// Verificar se há um cookie para forçar o carregamento do perfil
const checkLoadProfileCookie = () => {
  if (typeof document === "undefined") return false
  const cookies = document.cookie.split(";")
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim()
    if (cookie.startsWith("load_profile=true")) {
      // Limpar o cookie após verificá-lo
      document.cookie = "load_profile=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      return true
    }
  }
  return false
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false) // Novo estado para controlar carregamento inicial
  const { toast } = useToast()
  const supabase = getSupabase()

  // Função para buscar o perfil do usuário
  const fetchProfile = async (retryCount = 0, forceReload = false) => {
    // Se já completou o carregamento inicial e não é um forceReload, não carregar novamente
    if (initialLoadComplete && !forceReload) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Verificar se há um cookie de login bem-sucedido
      const isLoginSuccess = checkLoginSuccessCookie()
      if (isLoginSuccess) {
        setIsAuthenticated(true)
      }

      // Verificar se estamos em modo de desenvolvimento com bypass ativado
      if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
        setIsAuthenticated(true)
        loadFromLocalStorage()
        setInitialLoadComplete(true) // Marcar carregamento inicial como completo
        return
      }

      try {
        // Primeiro, tentar obter a sessão
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          if (isSessionMissingError(sessionError) && retryCount < 3) {
            setTimeout(
              () => {
                fetchProfile(retryCount + 1)
              },
              (retryCount + 1) * 500,
            )

            return
          }

          throw sessionError
        }

        // Se temos uma sessão, verificar o usuário
        if (sessionData.session) {
          const { data: userData, error: userError } = await supabase.auth.getUser()

          if (userError) {
            if (isSessionMissingError(userError) && retryCount < 3) {
              setTimeout(
                () => {
                  fetchProfile(retryCount + 1)
                },
                (retryCount + 1) * 500,
              )

              return
            }

            throw userError
          }

          if (userData.user) {
            setIsAuthenticated(true)

            try {
              // Buscar o perfil do usuário autenticado
              const { data: authProfile, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userData.user.id)
                .limit(1)

              if (profileError) {
                // Se for um erro de RLS, tentar criar o perfil
                if (isRLSError(profileError)) {
                  try {
                    // Tentar criar o perfil do usuário
                    const { error: insertError } = await supabase.from("profiles").insert([
                      {
                        id: userData.user.id,
                        name: userData.user.user_metadata?.name || "Usuário",
                        email: userData.user.email,
                        currency: "EUR",
                        show_cents: true,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                    ])

                    if (insertError) {
                      // Se falhar, usar localStorage
                      loadFromLocalStorage(userData.user.id, userData.user.email, userData.user.user_metadata?.name)
                      setInitialLoadComplete(true) // Marcar carregamento inicial como completo
                      return
                    }

                    // Buscar o perfil recém-criado
                    const { data: newProfile, error: newProfileError } = await supabase
                      .from("profiles")
                      .select("*")
                      .eq("id", userData.user.id)
                      .limit(1)

                    if (newProfileError || !newProfile || newProfile.length === 0) {
                      loadFromLocalStorage(userData.user.id, userData.user.email, userData.user.user_metadata?.name)
                      setInitialLoadComplete(true) // Marcar carregamento inicial como completo
                      return
                    }

                    mapProfileData(newProfile[0])
                    setInitialLoadComplete(true) // Marcar carregamento inicial como completo
                    return
                  } catch (createError) {
                    loadFromLocalStorage(userData.user.id, userData.user.email, userData.user.user_metadata?.name)
                    setInitialLoadComplete(true) // Marcar carregamento inicial como completo
                    return
                  }
                }

                throw profileError
              }

              if (authProfile && authProfile.length > 0) {
                mapProfileData(authProfile[0])
                setInitialLoadComplete(true) // Marcar carregamento inicial como completo
                return
              }

              // Se não encontrou perfil para o usuário autenticado, criar um
              try {
                // Criar perfil para o usuário
                const { error: insertError } = await supabase.from("profiles").insert([
                  {
                    id: userData.user.id,
                    name: userData.user.user_metadata?.name || "Usuário",
                    email: userData.user.email,
                    currency: "EUR",
                    show_cents: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                ])

                if (insertError) {
                  loadFromLocalStorage(userData.user.id, userData.user.email, userData.user.user_metadata?.name)
                  setInitialLoadComplete(true) // Marcar carregamento inicial como completo
                  return
                }

                // Buscar o perfil recém-criado
                const { data: newProfile, error: newProfileError } = await supabase
                  .from("profiles")
                  .select("*")
                  .eq("id", userData.user.id)
                  .limit(1)

                if (newProfileError || !newProfile || newProfile.length === 0) {
                  loadFromLocalStorage(userData.user.id, userData.user.email, userData.user.user_metadata?.name)
                  setInitialLoadComplete(true) // Marcar carregamento inicial como completo
                  return
                }

                mapProfileData(newProfile[0])
                setInitialLoadComplete(true) // Marcar carregamento inicial como completo
              } catch (createError) {
                loadFromLocalStorage(userData.user.id, userData.user.email, userData.user.user_metadata?.name)
                setInitialLoadComplete(true) // Marcar carregamento inicial como completo
              }
            } catch (profileErr) {
              // Em caso de erro ao buscar perfil, ainda manter o usuário como autenticado
              // mas usar dados locais
              loadFromLocalStorage(userData.user.id, userData.user.email, userData.user.user_metadata?.name)
              setInitialLoadComplete(true) // Marcar carregamento inicial como completo
            }
          } else {
            // Usuário não autenticado
            setIsAuthenticated(false)
            setProfile(null)
            handleDevelopmentMode()
            setInitialLoadComplete(true) // Marcar carregamento inicial como completo
          }
        } else {
          // Sessão não encontrada
          setIsAuthenticated(false)
          setProfile(null)
          handleDevelopmentMode()
          setInitialLoadComplete(true) // Marcar carregamento inicial como completo
        }
      } catch (authErr) {
        // Capturar qualquer erro na verificação de autenticação
        if (isSessionMissingError(authErr) && retryCount < 3) {
          setTimeout(
            () => {
              fetchProfile(retryCount + 1)
            },
            (retryCount + 1) * 500,
          )

          return
        }

        setIsAuthenticated(false)
        setProfile(null)
        handleDevelopmentMode()
        setInitialLoadComplete(true) // Marcar carregamento inicial como completo
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro desconhecido"))
      setIsAuthenticated(false)
      setProfile(null)
      handleDevelopmentMode()
      setInitialLoadComplete(true) // Marcar carregamento inicial como completo
    } finally {
      if (retryCount === 0 || retryCount >= 3) {
        setLoading(false)
      }
    }
  }

  // Função para lidar com o modo de desenvolvimento
  const handleDevelopmentMode = () => {
    // Verificar se estamos em modo de desenvolvimento com bypass ativado
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
      setIsAuthenticated(true)
      loadFromLocalStorage()
      setInitialLoadComplete(true) // Marcar carregamento inicial como completo
    }
  }

  // Função para remover o sufixo "(Atualizado)" do nome
  const cleanName = (name: string): string => {
    return name.replace(/\s*$$Atualizado$$\s*$/, "")
  }

  // Função para mapear os dados do Supabase para o formato do perfil
  const mapProfileData = (data: any) => {
    // Garantir que temos valores padrão para todos os campos
    const userProfile: UserProfile = {
      id: data.id,
      name: cleanName(data.name || "Usuário"),
      email: data.email || "usuario@exemplo.com",
      avatarUrl: data.avatar_url || undefined,
      countryCode: data.country_code || "+351",
      familyCode: data.family_code || undefined,
      associatedFamilyCode: data.associated_family_code || undefined,
      currency: data.currency || "EUR",
      showCents: data.show_cents !== undefined ? data.show_cents : true,
      budgetAlerts: data.budget_alerts || false,
      monthlyBudget: data.monthly_budget || undefined,
    }

    setProfile(userProfile)

    // Também salvar no localStorage como backup
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userProfile))
  }

  // Função para carregar o perfil do localStorage
  const loadFromLocalStorage = (userId?: string, userEmail?: string, userName?: string) => {
    try {
      const savedProfile = localStorage.getItem(STORAGE_KEY)

      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile)

        // Limpar o nome se tiver o sufixo "(Atualizado)"
        if (parsedProfile.name) {
          parsedProfile.name = cleanName(parsedProfile.name)
        }

        // Se temos um userId, atualizar o perfil local com as informações do usuário autenticado
        if (userId) {
          parsedProfile.id = userId
          parsedProfile.email = userEmail || parsedProfile.email
          parsedProfile.name = userName ? cleanName(userName) : parsedProfile.name
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedProfile))
        }

        setProfile(parsedProfile)
      } else if (userId) {
        // Perfil temporário para usuário autenticado
        const defaultProfile: UserProfile = {
          id: userId,
          name: userName ? cleanName(userName) : "Usuário",
          email: userEmail || "usuario@exemplo.com",
          currency: "EUR",
          showCents: true,
        }
        setProfile(defaultProfile)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfile))
      } else if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
        // Perfil temporário para uso local em modo de desenvolvimento
        const defaultProfile: UserProfile = {
          name: "Usuário (Dev)",
          email: "dev@exemplo.com",
          currency: "EUR",
          showCents: true,
        }
        setProfile(defaultProfile)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfile))
      } else {
        // Se não estamos em modo de desenvolvimento e não há usuário autenticado,
        // não criar perfil padrão - isso forçará o redirecionamento para login
        setProfile(null)
      }
    } catch (error) {
      setError(error instanceof Error ? error : new Error("Erro ao carregar perfil local"))
    }
  }

  // Função para verificar e atualizar o estado de autenticação
  const checkAuthentication = async () => {
    try {
      // Verificar se estamos em modo de desenvolvimento com bypass
      if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
        setIsAuthenticated(true)
        return
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        setIsAuthenticated(false)
        return
      }

      if (sessionData.session) {
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError) {
          setIsAuthenticated(false)
          return
        }

        setIsAuthenticated(!!userData.user)

        if (userData.user && (!profile || profile.id !== userData.user.id)) {
          // Se o usuário está autenticado mas o perfil não corresponde, recarregar
          fetchProfile(0, true)
        }
      } else {
        setIsAuthenticated(false)

        if (profile?.id) {
          // Se o usuário não está autenticado mas temos um perfil com ID, limpar
          setProfile(null)
          loadFromLocalStorage()
        }
      }
    } catch (err) {
      setIsAuthenticated(false)
    }
  }

  // Função para recarregar o perfil
  const reloadProfile = async () => {
    await fetchProfile(0, true)
  }

  // Verificar se há um cookie para forçar o carregamento do perfil
  useEffect(() => {
    const shouldLoadProfile = checkLoadProfileCookie()
    if (shouldLoadProfile) {
      reloadProfile()
    }
  }, [])

  // Carregar perfil ao iniciar
  useEffect(() => {
    // Carregar perfil apenas uma vez na inicialização
    if (!initialLoadComplete) {
      fetchProfile()
    }

    // Configurar listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session) => {
      if (event === "SIGNED_IN") {
        setIsAuthenticated(true)
        // Recarregar perfil apenas se o evento for SIGNED_IN
        reloadProfile()
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false)
        setProfile(null)
        loadFromLocalStorage()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [initialLoadComplete]) // Dependência apenas no initialLoadComplete

  // Função para atualizar o perfil
  const updateProfile = async (newProfile: UserProfile) => {
    try {
      setLoading(true)

      // Limpar o nome se tiver o sufixo "(Atualizado)"
      if (newProfile.name) {
        newProfile.name = cleanName(newProfile.name)
      }

      // Sempre atualizar o estado local e o localStorage
      setProfile(newProfile)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile))

      // Se estiver usando localStorage ou não estiver autenticado, não tentar atualizar no Supabase
      if (!isAuthenticated) {
        toast({
          title: "Perfil atualizado localmente",
          description: "Suas informações foram atualizadas com sucesso (modo offline).",
        })
        return
      }

      // Verificar se temos um ID de usuário autenticado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        // Se for um erro de sessão ausente, tentar novamente com localStorage
        if (isSessionMissingError(userError)) {
          toast({
            title: "Perfil atualizado localmente",
            description: "Suas informações foram atualizadas apenas localmente devido a problemas de sessão.",
          })
          return
        }

        throw userError
      }

      if (!user) {
        toast({
          title: "Usuário não autenticado",
          description: "Você precisa estar autenticado para salvar o perfil no servidor.",
          variant: "destructive",
        })
        return
      }

      const profileId = user.id

      // Mapear o perfil para o formato do Supabase
      const profileData = {
        id: profileId,
        name: newProfile.name,
        email: newProfile.email || user.email,
        avatar_url: newProfile.avatarUrl || null,
        country_code: newProfile.countryCode || null,
        family_code: newProfile.familyCode || null,
        associated_family_code: newProfile.associatedFamilyCode || null,
        currency: newProfile.currency || "EUR",
        show_cents: newProfile.showCents !== undefined ? newProfile.showCents : true,
        budget_alerts: newProfile.budgetAlerts || false,
        monthly_budget: newProfile.monthlyBudget || null,
        updated_at: new Date().toISOString(),
      }

      // Atualizar o perfil no Supabase
      const { error: updateError } = await supabase.from("profiles").upsert(profileData)

      if (updateError) {
        // Se for um erro de RLS, usar localStorage
        if (isRLSError(updateError)) {
          toast({
            title: "Perfil atualizado localmente",
            description: "Suas informações foram atualizadas apenas localmente devido a restrições de permissão.",
          })
          return
        }
        throw updateError
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Erro ao atualizar perfil"))

      toast({
        title: "Erro ao atualizar perfil",
        description: err instanceof Error ? err.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, loading, error, isAuthenticated, reloadProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

// Hook para usar o perfil
export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider")
  }
  return context
}
