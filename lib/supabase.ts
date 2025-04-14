import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export type ChatMessage = {
  id: string
  text: string
  sender: "user" | "system"
  timestamp: Date | string
}

// Interface para o cliente mock
interface MockSupabaseClient {
  from: (table: string) => {
    select: () => Promise<{ data: any[]; error: null | Error }>
    insert: () => Promise<{ data: any[]; error: null | Error }>
    update: () => Promise<{ data: null; error: null }>
    delete: () => Promise<{ data: null; error: null }>
    order: (
      column: string,
      options?: { ascending?: boolean },
    ) => {
      select: () => Promise<{ data: any[]; error: null | Error }>
    }
    eq: (column: string, value: any) => Promise<{ data: null; error: null }>
  }
  channel: (name: string) => {
    on: (
      event: string,
      filter: any,
      callback: (payload: any) => void,
    ) => { subscribe: () => { unsubscribe: () => void } }
  }
  removeChannel: (channel: any) => void
  getChannels: () => any[]
  auth: {
    getUser: () => Promise<{ data: { user: null }; error: null }>
    getSession: () => Promise<{ data: { session: null }; error: null }>
    signInWithPassword: (credentials: { email: string; password: string }) => Promise<{
      data: any
      error: null | Error
    }>
    signUp: (credentials: { email: string; password: string; options?: any }) => Promise<{
      data: any
      error: null | Error
    }>
    signOut: () => Promise<{ error: null | Error }>
    resetPasswordForEmail: (email: string) => Promise<{ data: any; error: null | Error }>
    updateUser: (attributes: any) => Promise<{ data: any; error: null | Error }>
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
      data: { subscription: { unsubscribe: () => void } }
    }
  }
}

// Criação do cliente Supabase
// Usando as variáveis de ambiente disponíveis
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Singleton para o cliente Supabase no lado do cliente
let supabaseInstance: SupabaseClient | MockSupabaseClient | null = null

// Chave única para o cliente Supabase
const SUPABASE_CLIENT_KEY = "FINANCE_CHAT_SUPABASE_CLIENT"

export const getSupabase = () => {
  // Verificar se já existe uma instância global
  if (typeof window !== "undefined" && (window as any)[SUPABASE_CLIENT_KEY]) {
    return (window as any)[SUPABASE_CLIENT_KEY]
  }

  if (!supabaseInstance) {
    if (!supabaseUrl || !supabaseAnonKey) {
      // Verificar se estamos em modo de desenvolvimento com bypass
      if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
        const mockClient = createMockClient()
        if (typeof window !== "undefined") {
          ;(window as any)[SUPABASE_CLIENT_KEY] = mockClient
        }
        return mockClient
      }

      // Em produção, ainda retornamos um mock para evitar quebrar a aplicação
      const mockClient = createMockClient()
      if (typeof window !== "undefined") {
        ;(window as any)[SUPABASE_CLIENT_KEY] = mockClient
      }
      return mockClient
    }

    try {
      // Configurar o cliente com opções específicas para lidar melhor com a sessão
      const client = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
          storageKey: "supabase.auth.token",
        },
      })

      supabaseInstance = client

      // Armazenar a instância globalmente para evitar múltiplas instâncias
      if (typeof window !== "undefined") {
        ;(window as any)[SUPABASE_CLIENT_KEY] = client
      }
    } catch (error) {
      // Mesmo comportamento que acima
      if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
        const mockClient = createMockClient()
        if (typeof window !== "undefined") {
          ;(window as any)[SUPABASE_CLIENT_KEY] = mockClient
        }
        return mockClient
      }

      const mockClient = createMockClient()
      if (typeof window !== "undefined") {
        ;(window as any)[SUPABASE_CLIENT_KEY] = mockClient
      }
      return mockClient
    }
  }
  return supabaseInstance
}

// Cliente Supabase para o lado do servidor
export const createServerSupabase = () => {
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    // Erro de configuração do Supabase
    throw new Error("Supabase URL ou Service Role Key não encontrados")
  }

  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

// Funções de autenticação
export const signInWithEmail = async (email: string, password: string) => {
  const supabase = getSupabase()

  try {
    const result = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (result.error) {
      // Traduzir a mensagem de erro para português sem logar no console
      if (result.error.message === "Invalid login credentials") {
        const translatedError = new Error("Credenciais de login inválidas. Verifique seu email e senha.")
        translatedError.name = result.error.name
        return { data: result.data, error: translatedError }
      }
    }

    return result
  } catch (error) {
    throw error
  }
}

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  const supabase = getSupabase()
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      },
    },
  })
}

export const signOut = async () => {
  const supabase = getSupabase()

  try {
    // Chamar o método de signOut do Supabase
    const result = await supabase.auth.signOut()

    // Verificar se houve erro
    if (result.error) {
      return result
    }

    // Limpar qualquer cache ou estado local relacionado à autenticação
    if (typeof window !== "undefined") {
      // Limpar o localStorage
      try {
        localStorage.removeItem("supabase.auth.token")

        // Limpar outros itens relacionados ao Supabase
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith("supabase.")) {
            localStorage.removeItem(key)
          }
        }
      } catch (e) {}
    }

    return result
  } catch (error) {
    throw error
  }
}

export const resetPassword = async (email: string) => {
  const supabase = getSupabase()
  return await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
}

export const updatePassword = async (password: string) => {
  const supabase = getSupabase()
  return await supabase.auth.updateUser({
    password,
  })
}

// Função para criar um cliente mock
function createMockClient(): MockSupabaseClient {
  // Implementação simplificada para ambiente de desenvolvimento
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      order: () => ({ select: () => Promise.resolve({ data: [], error: null }) }),
      eq: () => Promise.resolve({ data: null, error: null }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
    }),
    removeChannel: () => {},
    getChannels: () => [],
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: null }),
      signUp: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: null }),
      updateUser: () => Promise.resolve({ data: null, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  }
}

// Função para verificar se o erro está relacionado ao RLS
export function isRLSError(error: unknown): boolean {
  if (!error) return false

  const errorObj = error as { message?: string; code?: string }

  return !!(
    errorObj.message?.includes("row-level security") ||
    errorObj.message?.includes("violates row-level security policy") ||
    errorObj.code === "PGRST301"
  )
}

// Função para verificar se o erro é relacionado à sessão ausente
export function isSessionMissingError(error: unknown): boolean {
  if (!error) return false

  const errorObj = error as { message?: string; code?: string }

  return !!(
    errorObj.message?.includes("Auth session missing") ||
    errorObj.message?.includes("JWT expired") ||
    errorObj.message?.includes("Invalid JWT")
  )
}

// Função para verificar se o usuário está autenticado de forma segura
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    // Verificar se estamos em modo de desenvolvimento com bypass
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
      return true
    }

    const supabase = getSupabase()

    // Verificar se o usuário está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()

    return !!session
  } catch (error) {
    return false
  }
}
