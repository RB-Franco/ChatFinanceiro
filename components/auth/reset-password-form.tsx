"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { updatePassword } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Loader2, KeyRound, ArrowLeft, Save } from "lucide-react"
import { motion } from "framer-motion"
import { MinimalInput } from "@/components/ui/minimal-input"
import { MinimalButton } from "@/components/ui/minimal-button"

export function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "Por favor, verifique se as senhas digitadas são iguais.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await updatePassword(password)

      if (error) throw error

      toast({
        title: "Senha redefinida com sucesso",
        description: "Sua senha foi atualizada. Você pode fazer login agora.",
      })

      // Redirecionar para a página de login
      router.push("/login")
    } catch (error: any) {
      toast({
        title: "Erro ao redefinir senha",
        description: error.message || "Ocorreu um erro ao redefinir sua senha. Tente novamente.",
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
            <CardTitle className="text-2xl text-teal-600 dark:text-teal-400">Redefinir Senha</CardTitle>
          </motion.div>
        </div>
        <CardDescription className="text-teal-700 dark:text-teal-300">
          Digite sua nova senha para continuar
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <MinimalInput
            icon={<KeyRound className="h-5 w-5" />}
            label="Nova Senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <MinimalInput
            icon={<KeyRound className="h-5 w-5" />}
            label="Confirmar Nova Senha"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />

          <div className="pt-4">
            <MinimalButton type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Redefinir Senha
                </>
              )}
            </MinimalButton>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 border-t border-teal-100 dark:border-teal-900/30 pt-4">
        <div className="text-sm text-center text-teal-700 dark:text-teal-300">
          <Link
            href="/login"
            className="text-teal-600 dark:text-teal-400 hover:underline flex items-center justify-center gap-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o login
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
