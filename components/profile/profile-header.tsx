"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, User, Mail, Hash, Users, Calendar, MapPin, Shield } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useProfile } from "@/components/profile/profile-provider"
import { Separator } from "@/components/ui/separator"
import { getSupabase } from "@/lib/supabase"

export function ProfileHeader() {
  const [mounted, setMounted] = useState(false)
  const { profile, updateProfile } = useProfile()
  const { toast } = useToast()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = getSupabase()

  useEffect(() => {
    setMounted(true)
    if (profile?.avatarUrl) {
      setImagePreview(profile.avatarUrl)
    }
  }, [profile])

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Verificar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione uma imagem.",
        variant: "destructive",
      })
      return
    }

    // Verificar tamanho do arquivo (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo permitido é 5MB.",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)

      // Primeiro, criar um preview local usando FileReader
      const reader = new FileReader()
      reader.onload = async (e) => {
        const result = e.target?.result as string
        setImagePreview(result)

        try {
          // Gerar um nome único para o arquivo
          const fileExt = file.name.split(".").pop()
          const fileName = `profile-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
          const filePath = `avatars/${fileName}`

          // Fazer upload do arquivo para o Supabase Storage
          const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, {
            upsert: true,
            contentType: file.type,
          })

          if (uploadError) {
            console.warn("Erro ao fazer upload para o Supabase Storage:", uploadError)
            // Em caso de erro, usar o preview local
            await updateProfile({
              ...profile!,
              avatarUrl: result,
            })
            return
          }

          // Obter a URL pública do arquivo
          const {
            data: { publicUrl },
          } = supabase.storage.from("avatars").getPublicUrl(filePath)

          // Atualizar perfil com a URL do Supabase
          await updateProfile({
            ...profile!,
            avatarUrl: publicUrl,
          })

          toast({
            title: "Imagem atualizada",
            description: "Sua foto de perfil foi atualizada com sucesso.",
          })
        } catch (error) {
          console.error("Erro ao processar upload:", error)
          // Em caso de erro, usar o preview local
          await updateProfile({
            ...profile!,
            avatarUrl: result,
          })
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Erro ao fazer upload da imagem:", error)
      toast({
        title: "Erro ao atualizar imagem",
        description: "Não foi possível fazer o upload da imagem.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  if (!mounted) return null

  // Obter a data de hoje formatada
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Função para gerar iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Garantir que temos um perfil para exibir
  const displayProfile = profile || {
    name: "Usuário",
    email: "usuario@exemplo.com",
  }

  // Log para debug

  return (
    <Card className="w-full overflow-hidden border shadow-md hover:shadow-lg transition-all">
      <CardContent className="p-0">
        {/* Novo layout com padrão geométrico e gradiente */}
        <div className="relative">
          {/* Padrão de fundo decorativo */}
          <div className="h-28 bg-gradient-to-r from-teal-600 to-cyan-600 dark:from-teal-800 dark:to-cyan-800 overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -left-4 -top-4 w-32 h-32 rounded-full bg-white"></div>
              <div className="absolute right-1/4 -bottom-10 w-40 h-40 rounded-full bg-white"></div>
              <div className="absolute left-1/3 top-1/2 w-24 h-24 rounded-full bg-white"></div>
              <div className="absolute right-10 top-5 w-16 h-16 rounded-full bg-white"></div>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="px-6 py-5 bg-card">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Coluna esquerda - Avatar e informações básicas */}
              <div className="flex flex-col items-center md:items-start">
                {/* Avatar com posicionamento diferente */}
                <div className="relative -mt-16 mb-3 flex justify-center">
                  <div className="relative rounded-xl overflow-hidden border-4 border-background shadow-lg">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={imagePreview || ""} alt={displayProfile.name || "Usuário"} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white">
                        {displayProfile.name ? getInitials(displayProfile.name) : <User className="h-10 w-10" />}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar-upload"
                      className={`absolute inset-0 ${uploading ? "bg-black/30" : "bg-black/0 hover:bg-black/30"} transition-colors flex items-center justify-center cursor-pointer group`}
                    >
                      <Camera
                        className={`h-8 w-8 text-white ${uploading ? "opacity-100 animate-pulse" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                      />
                      <span className="sr-only">Alterar foto</span>
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </div>
                </div>

                {/* Nome e email */}
                <div className="text-center md:text-left">
                  <h2 className="text-xl font-bold">{displayProfile.name || "Seu Nome"}</h2>
                  <div className="flex items-center justify-center md:justify-start text-muted-foreground mt-1 text-sm">
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    <span>{displayProfile.email || "seu.email@exemplo.com"}</span>
                  </div>
                </div>
              </div>

              {/* Separador vertical apenas em telas médias e grandes */}
              <div className="hidden md:block">
                <Separator orientation="vertical" className="h-full" />
              </div>

              {/* Separador horizontal apenas em telas pequenas */}
              <div className="md:hidden">
                <Separator className="my-4" />
              </div>

              {/* Coluna direita - Informações detalhadas e badges */}
              <div className="flex-1 flex flex-col gap-4">
                {/* Linha superior com data e fuso horário */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center bg-muted/30 px-3 py-1.5 rounded-md">
                    <Calendar className="h-4 w-4 mr-2 text-teal-600 dark:text-teal-400" />
                    <span>{today}</span>
                  </div>

                  <div className="flex items-center bg-muted/30 px-3 py-1.5 rounded-md">
                    <MapPin className="h-4 w-4 mr-2 text-cyan-600 dark:text-cyan-400" />
                    <span>Fuso horário: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                  </div>
                </div>

                {/* Linha com badges de status */}
                <div className="flex flex-wrap gap-3">
                  {displayProfile.familyCode ? (
                    <div className="flex items-center gap-2 bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 px-3 py-2 rounded-md border border-teal-200 dark:border-teal-800/30">
                      <Shield className="h-4 w-4" />
                      <div>
                        <div className="text-xs font-medium">Administrador de Família</div>
                        <div className="flex items-center text-xs">
                          <Hash className="h-3 w-3 mr-1" />
                          <span>Código: {displayProfile.familyCode}</span>
                        </div>
                      </div>
                    </div>
                  ) : displayProfile.associatedFamilyCode ? (
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-md border border-blue-200 dark:border-blue-800/30">
                      <Users className="h-4 w-4" />
                      <div>
                        <div className="text-xs font-medium">Membro de Família</div>
                        <div className="flex items-center text-xs">
                          <Hash className="h-3 w-3 mr-1" />
                          <span>Associado: {displayProfile.associatedFamilyCode}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-3 py-2 rounded-md border border-amber-200 dark:border-amber-800/30">
                      <User className="h-4 w-4" />
                      <div>
                        <div className="text-xs font-medium">Usuário Individual</div>
                        <div className="text-xs">Sem associação familiar</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
