"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, User, Mail, KeyRound } from "lucide-react"
import { getSupabase } from "@/lib/supabase"
import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { MinimalInput } from "@/components/ui/minimal-input"
import { MinimalButton } from "@/components/ui/minimal-button"

export function RegisterForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const router = useRouter()
  const supabase = getSupabase()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validações básicas
    if (!name || !email || !password) {
      setError("Por favor, preencha todos os campos")
      return
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    try {
      setLoading(true)

      // Registrar o usuário
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      })

      if (signUpError) throw signUpError

      // Criar o perfil do usuário
      if (data.user) {
        try {
          const { error: profileError } = await supabase.from("profiles").insert([
            {
              id: data.user.id,
              name,
              email,
              currency: "EUR",
              show_cents: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])

          if (profileError) {
            // Continuar mesmo com erro no perfil, pois o usuário foi criado
          }
        } catch (profileErr) {
          // Continuar mesmo com erro no perfil
        }
      }

      // Mostrar mensagem de sucesso
      setSuccess(true)
      setSuccessMessage("Cadastro realizado com sucesso! Redirecionando para o login...")

      // Redirecionar para a página de login após um breve delay para mostrar a mensagem
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar. Tente novamente.")
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
          Crie sua conta para começar a gerenciar suas finanças
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

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800/30 text-green-800 dark:text-green-300 rounded-md text-sm flex items-start"
          >
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
                className="text-green-500"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <span>{successMessage}</span>
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <MinimalInput
            icon={<User className="h-5 w-5" />}
            label="Nome"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading || success}
          />

          <MinimalInput
            icon={<Mail className="h-5 w-5" />}
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || success}
          />

          <MinimalInput
            icon={<KeyRound className="h-5 w-5" />}
            label="Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading || success}
          />

          <MinimalInput
            icon={<KeyRound className="h-5 w-5" />}
            label="Confirmar Senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading || success}
          />

          <div className="pt-4">
            <MinimalButton
              type="submit"
              className="w-full bg-teal-500 hover:bg-teal-600 text-white dark:bg-teal-600 dark:hover:bg-teal-700"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : success ? (
                <>
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
                    className="mr-2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  Cadastrado
                </>
              ) : (
                <>
                  <User className="mr-2 h-4 w-4" />
                  Cadastrar
                </>
              )}
            </MinimalButton>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 border-t border-teal-100 dark:border-teal-900/30 pt-4">
        <div className="text-sm text-center text-teal-700 dark:text-teal-300">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-teal-600 dark:text-teal-400 hover:underline">
            Faça login
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
