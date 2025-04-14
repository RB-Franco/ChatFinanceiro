"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signInWithEmail } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Loader2, LogIn, Mail, KeyRound } from "lucide-react"
import { motion } from "framer-motion"
import { MinimalInput } from "@/components/ui/minimal-input"
import { MinimalButton } from "@/components/ui/minimal-button"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const redirectTo = searchParams.get("redirect") || "/dashboard"

  // Efeito para lidar com o redirecionamento após login bem-sucedido
  useEffect(() => {
    if (loginSuccess) {
      // Definir um cookie para indicar que o login foi bem-sucedido
      document.cookie = "auth_login_success=true; path=/; max-age=30" // 30 segundos

      // Definir um cookie de sessão para manter a autenticação durante navegações
      document.cookie = "auth_session=true; path=/; max-age=3600" // 1 hora

      // Definir um cookie para forçar o carregamento do perfil
      document.cookie = "load_profile=true; path=/; max-age=30" // 30 segundos

      // Adicionar classe para iniciar a animação de saída
      document.body.classList.add("page-transitioning-out")

      // Usar setTimeout para dar tempo para a sessão ser estabelecida
      // e para a animação de saída ser concluída
      const timer = setTimeout(() => {
        // Usar router.push para navegação do lado do cliente
        router.push(redirectTo)
      }, 1000) // Aumentado para 1000ms para garantir que os cookies sejam definidos

      return () => clearTimeout(timer)
    }
  }, [loginSuccess, redirectTo, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await signInWithEmail(email, password)

      if (error) {
        throw error
      }

      // Marcar login como bem-sucedido para acionar o efeito de redirecionamento
      setLoginSuccess(true)
    } catch (error: any) {
      // A mensagem já deve estar traduzida pela função signInWithEmail
      const errorMessage = error.message || "Verifique suas credenciais e tente novamente."
      setError(errorMessage)

      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg bg-gradient-to-r from-white to-green-50 dark:from-gray-900 dark:to-green-950/30 border-none shadow-xl">
      <CardHeader className="space-y-1 border-b border-teal-100 dark:border-teal-900/30 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <BarChart3 className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          </motion.div>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <CardTitle className="text-2xl text-teal-600 dark:text-teal-400">FinanceChat</CardTitle>
          </motion.div>
        </div>
        <CardDescription className="text-teal-700 dark:text-teal-300">
          Entre com seu email e senha para acessar sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800/30 text-red-800 dark:text-red-300 rounded-md text-sm flex items-start">
            <div className="mr-2 mt-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <MinimalInput
            icon={<Mail className="h-5 w-5" />}
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || loginSuccess}
          />

          <MinimalInput
            icon={<KeyRound className="h-5 w-5" />}
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || loginSuccess}
          />

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-teal-200"
            >
              Esqueceu sua senha?
            </Link>
          </div>

          <div className="pt-4">
            <MinimalButton
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white dark:bg-teal-600 dark:hover:bg-teal-700"
              disabled={loading || loginSuccess}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : loginSuccess ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecionando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Entrar
                </>
              )}
            </MinimalButton>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 border-t border-teal-100 dark:border-teal-900/30 pt-4">
        <div className="text-sm text-center text-teal-700 dark:text-teal-300">
          Não tem uma conta?{" "}
          <Link href="/register" className="text-teal-600 dark:text-teal-400 hover:underline">
            Cadastre-se
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
