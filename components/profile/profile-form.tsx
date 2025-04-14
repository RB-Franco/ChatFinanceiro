"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useProfile } from "@/components/profile/profile-provider"
import { useToast } from "@/components/ui/use-toast"
import { User, Mail, Lock, KeyRound, ShieldCheck, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { updatePassword } from "@/lib/supabase" // Adicionar esta importação

export function ProfileForm() {
  const { profile, updateProfile, loading: profileLoading } = useProfile()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Carregar dados do perfil quando disponíveis
  useEffect(() => {
    if (profile) {
      setName(profile.name || "")
      setEmail(profile.email || "")
    }
    setMounted(true)
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    try {
      setIsSaving(true)

      // Validar nome
      if (!name.trim()) {
        toast({
          title: "Nome obrigatório",
          description: "Por favor, informe seu nome.",
          variant: "destructive",
        })
        return
      }

      // Atualizar perfil
      await updateProfile({
        ...profile,
        name: name.trim(),
      })

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar suas informações.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsChangingPassword(true)

      // Validar senha atual
      if (!currentPassword) {
        toast({
          title: "Senha atual obrigatória",
          description: "Por favor, informe sua senha atual.",
          variant: "destructive",
        })
        return
      }

      // Validar nova senha
      if (newPassword.length < 6) {
        toast({
          title: "Senha muito curta",
          description: "A nova senha deve ter pelo menos 6 caracteres.",
          variant: "destructive",
        })
        return
      }

      // Validar confirmação de senha
      if (newPassword !== confirmPassword) {
        toast({
          title: "Senhas não coincidem",
          description: "A nova senha e a confirmação devem ser iguais.",
          variant: "destructive",
        })
        return
      }

      // Implementar a alteração de senha usando o Supabase
      const { error } = await updatePassword(newPassword)

      if (error) {
        throw error
      }

      toast({
        title: "Senha alterada",
        description: "Sua senha foi alterada com sucesso.",
      })

      // Limpar campos de senha
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error)
      toast({
        title: "Erro ao alterar senha",
        description: error.message || "Não foi possível alterar sua senha.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="h-6 w-40 bg-muted animate-pulse rounded mb-2"></div>
            <div className="h-4 w-60 bg-muted animate-pulse rounded"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-10 w-32 bg-muted animate-pulse rounded ml-auto"></div>
          </CardFooter>
        </Card>
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <div className="h-6 w-40 bg-muted animate-pulse rounded mb-2"></div>
            <div className="h-4 w-60 bg-muted animate-pulse rounded"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
              <div className="h-10 w-full bg-muted animate-pulse rounded"></div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-10 w-32 bg-muted animate-pulse rounded ml-auto"></div>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 dashboard-transition fade-in">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>Atualize suas informações básicas de perfil</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="w-full"
                disabled={isSaving || profileLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                Email
              </Label>
              <Input id="email" value={email} disabled className="w-full bg-muted/50" />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSaving || profileLoading} className="ml-auto">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Alterar Senha
          </CardTitle>
          <CardDescription>Atualize sua senha de acesso</CardDescription>
        </CardHeader>
        <form onSubmit={handlePasswordChange}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-sm font-medium flex items-center gap-1">
                <KeyRound className="h-3.5 w-3.5" />
                Senha Atual
              </Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
                disabled={isChangingPassword}
              />
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Nova Senha
              </Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
                disabled={isChangingPassword}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Confirmar Nova Senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full"
                disabled={isChangingPassword}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isChangingPassword} className="ml-auto">
              {isChangingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alterando...
                </>
              ) : (
                "Alterar Senha"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
