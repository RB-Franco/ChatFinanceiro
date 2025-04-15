"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useProfile } from "@/components/profile/profile-provider"
import { Copy, Users, Trash2, Unlink, UserPlus, Home, Key, RefreshCw, LinkIcon } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export function FamilyCodeSection() {
  const [mounted, setMounted] = useState(false)
  const { profile, updateProfile } = useProfile()
  const { toast } = useToast()
  const [associationCode, setAssociationCode] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDisassociateDialog, setShowDisassociateDialog] = useState(false)
  const [activeTab, setActiveTab] = useState<"agregador" | "agregado">("agregador")

  useEffect(() => {
    setMounted(true)

    // Definir a tab ativa com base no perfil atual
    if (profile) {
      if (profile.familyCode) {
        setActiveTab("agregador")
      } else if (profile.associatedFamilyCode) {
        setActiveTab("agregado")
      }
    }
  }, [profile])

  const generateFamilyCode = () => {
    // Gerar código aleatório de 8 caracteres alfanuméricos
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    updateProfile({
      ...profile!,
      name: profile?.name || "Usuário", // Garantir que name nunca seja undefined
      familyCode: result,
    })

    toast({
      title: "Código gerado",
      description: `Seu código de agregado familiar é: ${result}`,
    })
  }

  const copyFamilyCode = () => {
    if (profile?.familyCode) {
      navigator.clipboard.writeText(profile.familyCode)
      toast({
        title: "Código copiado",
        description: "Código copiado para a área de transferência.",
      })
    }
  }

  const deleteFamilyCode = () => {
    updateProfile({
      ...profile!,
      name: profile?.name || "Usuário",
      familyCode: undefined,
    })

    toast({
      title: "Código apagado",
      description: "Seu código de agregado familiar foi apagado com sucesso.",
    })

    setShowDeleteDialog(false)
  }

  const disassociateFromFamily = () => {
    updateProfile({
      ...profile!,
      name: profile?.name || "Usuário",
      associatedFamilyCode: undefined,
    })

    toast({
      title: "Desassociação realizada",
      description: "Você foi desassociado do agregado familiar com sucesso.",
    })

    setShowDisassociateDialog(false)
  }

  const associateWithFamily = () => {
    if (!associationCode.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Por favor, insira um código de agregado familiar.",
        variant: "destructive",
      })
      return
    }

    // Simular validação do código
    if (associationCode.length !== 8) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 8 caracteres.",
        variant: "destructive",
      })
      return
    }

    updateProfile({
      ...profile!,
      name: profile?.name || "Usuário",
      associatedFamilyCode: associationCode,
    })

    toast({
      title: "Associação realizada",
      description: `Você foi associado ao agregado familiar com código: ${associationCode}`,
    })

    setAssociationCode("")
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as "agregador" | "agregado")
  }

  if (!mounted) return null

  const canGenerateCode = !profile?.familyCode && !profile?.associatedFamilyCode
  const canAssociate = !profile?.familyCode && !profile?.associatedFamilyCode

  // Determinar qual tab deve estar disponível
  const isAgregadorDisabled = !!profile?.associatedFamilyCode
  const isAgregadoDisabled = !!profile?.familyCode

  return (
    <>
      <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-all dashboard-transition fade-in">
        <CardHeader className="bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20 pb-4">
          <div className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            <CardTitle>Agregado Familiar</CardTitle>
          </div>
          <CardDescription>Gerencie seu código de agregado familiar ou associe-se a um existente</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="bg-muted/20 p-4 rounded-lg border border-muted">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-medium">O que é um agregado familiar?</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Um agregado familiar permite que você compartilhe informações financeiras com membros da sua família.
                Você pode criar seu próprio agregado ou juntar-se a um existente usando um código de convite.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="agregador" disabled={isAgregadorDisabled} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span>Criar Agregado</span>
                </TabsTrigger>
                <TabsTrigger value="agregado" disabled={isAgregadoDisabled} className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Juntar-se a Agregado</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="agregador" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="family-code" className="flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-muted-foreground" />
                    Seu Código de Agregado Familiar
                  </Label>
                  <div className="flex">
                    <Input
                      id="family-code"
                      value={profile?.familyCode || ""}
                      placeholder="Nenhum código gerado"
                      readOnly
                      className="font-mono border-input/60 focus-visible:ring-teal-500/20"
                    />
                    {profile?.familyCode && (
                      <Button variant="outline" className="ml-2" onClick={copyFamilyCode}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    {profile?.familyCode
                      ? "Compartilhe este código com membros da sua família para que eles possam se associar."
                      : "Gere um código para criar seu agregado familiar."}
                  </p>

                  <div className="flex gap-2">
                    {!profile?.familyCode ? (
                      <Button
                        onClick={generateFamilyCode}
                        disabled={!canGenerateCode}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Gerar Código
                      </Button>
                    ) : (
                      <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Apagar
                      </Button>
                    )}
                  </div>
                </div>

                {isAgregadorDisabled && (
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-md text-sm">
                    Você já está associado a um agregado familiar. Desassocie-se primeiro para poder criar seu próprio
                    agregado.
                  </div>
                )}

                {profile?.familyCode && (
                  <div className="mt-4">
                    <Badge
                      variant="outline"
                      className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
                    >
                      Você é um administrador de agregado familiar
                    </Badge>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="agregado" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="association-code" className="flex items-center gap-1.5">
                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Código de Associação
                  </Label>
                  <div className="flex">
                    <Input
                      id="association-code"
                      value={profile?.associatedFamilyCode || associationCode}
                      onChange={(e) => setAssociationCode(e.target.value)}
                      placeholder="Digite o código de associação"
                      disabled={!!profile?.associatedFamilyCode}
                      className="font-mono border-input/60 focus-visible:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    {profile?.associatedFamilyCode
                      ? `Você está associado ao agregado: ${profile.associatedFamilyCode}`
                      : "Insira o código fornecido pelo criador do agregado familiar."}
                  </p>

                  <div className="flex gap-2">
                    {!profile?.associatedFamilyCode ? (
                      <Button
                        onClick={associateWithFamily}
                        disabled={!canAssociate || !associationCode}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Associar
                      </Button>
                    ) : (
                      <Button variant="destructive" onClick={() => setShowDisassociateDialog(true)}>
                        <Unlink className="h-4 w-4 mr-2" />
                        Desassociar
                      </Button>
                    )}
                  </div>
                </div>

                {isAgregadoDisabled && (
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-md text-sm">
                    Você já possui um código de agregado familiar. Apague seu código primeiro para poder associar-se a
                    outro agregado.
                  </div>
                )}

                {profile?.associatedFamilyCode && (
                  <div className="mt-4">
                    <Badge
                      variant="outline"
                      className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                    >
                      Você é um membro de agregado familiar
                    </Badge>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmação para apagar código */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar código de agregado familiar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso apagará permanentemente seu código de agregado familiar. Outros
              membros que estejam associados a este código não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFamilyCode} className="bg-destructive text-destructive-foreground">
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmação para desassociar */}
      <AlertDialog open={showDisassociateDialog} onOpenChange={setShowDisassociateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desassociar do agregado familiar?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso removerá sua associação com o agregado familiar atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={disassociateFromFamily} className="bg-destructive text-destructive-foreground">
              Desassociar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
