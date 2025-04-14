// Este arquivo cria um cliente Supabase com a service_role para operações administrativas
import { createClient } from "@supabase/supabase-js"

// Variáveis de ambiente para o cliente admin
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Criar cliente Supabase com a service_role
export const getSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase URL ou Service Role Key não encontrados nas variáveis de ambiente")
    throw new Error("Configuração de admin do Supabase incompleta")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Função para criar perfil de usuário usando o cliente admin
export const createUserProfileAdmin = async (userId: string, profileData: any) => {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Garantir que o ID do usuário está definido corretamente
    const profile = {
      id: userId,
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabaseAdmin.from("profiles").upsert(profile).select()

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error("Erro ao criar perfil de usuário (admin):", error)
    return { data: null, error }
  }
}
