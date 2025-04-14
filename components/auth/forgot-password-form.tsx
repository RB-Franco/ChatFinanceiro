"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { resetPassword } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Loader2, Mail, ArrowLeft, Send } from "lucide-react"
import { motion } from "framer-motion"
import { MinimalInput } from "@/components/ui/minimal-input"
import { MinimalButton } from "@/components/ui/minimal-button"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await resetPassword(email)

      if (error) throw error

      setSubmitted(true)
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      })
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Verifique o email informado e tente novamente.",
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
            <CardTitle className="text-2xl text-teal-600 dark:text-teal-400">Recuperar Senha</CardTitle>
          </motion.div>
        </div>
        <CardDescription className="text-teal-700 dark:text-teal-300">
          Digite seu email para receber instruções de recuperação de senha.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {submitted ? (
          <div className="text-center py-4 space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center"
            >
              <div className="bg-teal-100 dark:bg-teal-900/30 text-teal-500 dark:text-teal-400 p-3 rounded-full">
                <Mail className="h-8 w-8" />
              </div>
            </motion.div>
            <p className="text-teal-700 dark:text-teal-300">
              Verifique sua caixa de entrada e siga as instruções no email para redefinir sua senha.
            </p>
            <p className="text-sm text-teal-600/80 dark:text-teal-400/80">
              Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <MinimalInput
              icon={<Mail className="h-5 w-5" />}
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <div className="pt-4">
              <MinimalButton type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar instruções
                  </>
                )}
              </MinimalButton>
            </div>
          </form>
        )}
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
