"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { getSupabase } from "@/lib/supabase"
import { Loader2, Database, RefreshCw, Clock, User, Mail, Calendar, AlertCircle } from "lucide-react"

// ID do usuário específico
const SPECIFIC_USER_ID = "97192deb-0fbd-487f-8514-a0e51bb3f779"

interface ProfileData {
  id: string
  name: string
  email: string
  avatar_url: string | null
  phone: string | null
  country_code: string | null
  family_code: string | null
  associated_family_code: string | null
  currency: string | null
  show_cents: boolean | null
  budget_alerts: boolean | null
  monthly_budget: number | null
  created_at: string | null
  updated_at: string | null
  [key: string]: any // Para campos adicionais
}

export function ProfileDatabaseInfo() {
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabase()

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar o perfil diretamente pelo ID
      const { data, error } = await supabase.from("profiles").select("*").eq("id", SPECIFIC_USER_ID).limit(1)

      if (error) {
        throw error
      }

      if (data && data.length > 0) {
        setProfileData(data[0])
      } else {
        setError(`Nenhum perfil encontrado com ID: ${SPECIFIC_USER_ID}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileData()
  }, [])

  // Formatar data para exibição
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"

    try {
      const date = new Date(dateString)
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch (e) {
      return dateString
    }
  }

  return (
    <Card className="border shadow-sm hover:shadow-md transition-all">
      <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Informações da Base de Dados
            </CardTitle>
            <CardDescription>
              Dados do perfil armazenados no Supabase (ID: {SPECIFIC_USER_ID.substring(0, 8)}...)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchProfileData} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Carregando dados do perfil...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-4 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Erro ao carregar dados:</p>
              <p className="mt-1">{error}</p>
              <p className="mt-2 text-sm">
                Verifique se o ID do usuário está correto e se o perfil existe no banco de dados.
              </p>
            </div>
          </div>
        ) : profileData ? (
          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Informações Básicas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">ID</div>
                  <div className="font-mono text-sm bg-muted/30 p-2 rounded-md overflow-x-auto">{profileData.id}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Nome</div>
                  <div className="font-medium bg-muted/30 p-2 rounded-md">{profileData.name || "Não definido"}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                    <Mail className="h-4 w-4 text-primary" />
                    {profileData.email || "Não definido"}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Telefone</div>
                  <div className="bg-muted/30 p-2 rounded-md">
                    {profileData.country_code && profileData.phone
                      ? `${profileData.country_code} ${profileData.phone}`
                      : "Não definido"}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Informações de família */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações de Família</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Código de Família</div>
                  <div className="bg-muted/30 p-2 rounded-md">
                    {profileData.family_code ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        {profileData.family_code}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Não definido</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Código Associado</div>
                  <div className="bg-muted/30 p-2 rounded-md">
                    {profileData.associated_family_code ? (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {profileData.associated_family_code}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Não definido</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Preferências financeiras */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Preferências Financeiras</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Moeda</div>
                  <div className="bg-muted/30 p-2 rounded-md">{profileData.currency || "EUR (padrão)"}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Mostrar Centavos</div>
                  <div className="bg-muted/30 p-2 rounded-md">
                    {profileData.show_cents === null ? "Sim (padrão)" : profileData.show_cents ? "Sim" : "Não"}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Alertas de Orçamento</div>
                  <div className="bg-muted/30 p-2 rounded-md">
                    {profileData.budget_alerts ? "Ativados" : "Desativados"}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Orçamento Mensal</div>
                  <div className="bg-muted/30 p-2 rounded-md">
                    {profileData.monthly_budget
                      ? new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: profileData.currency || "EUR",
                        }).format(profileData.monthly_budget)
                      : "Não definido"}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Informações de avatar */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Avatar</h3>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">URL do Avatar</div>
                <div className="font-mono text-xs bg-muted/30 p-2 rounded-md overflow-x-auto">
                  {profileData.avatar_url || "Não definido"}
                </div>
              </div>

              {profileData.avatar_url && (
                <div className="flex justify-center p-4 bg-muted/20 rounded-md">
                  <img
                    src={profileData.avatar_url || "/placeholder.svg"}
                    alt="Avatar"
                    className="h-24 w-24 rounded-lg object-cover border-2 border-muted"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg?height=96&width=96"
                      e.currentTarget.alt = "Imagem não disponível"
                    }}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Metadados */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Metadados
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Criado em</div>
                  <div className="bg-muted/30 p-2 rounded-md">{formatDate(profileData.created_at)}</div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Atualizado em</div>
                  <div className="bg-muted/30 p-2 rounded-md">{formatDate(profileData.updated_at)}</div>
                </div>
              </div>
            </div>

            {/* Campos adicionais */}
            {Object.keys(profileData).filter(
              (key) =>
                ![
                  "id",
                  "name",
                  "email",
                  "avatar_url",
                  "phone",
                  "country_code",
                  "family_code",
                  "associated_family_code",
                  "currency",
                  "show_cents",
                  "budget_alerts",
                  "monthly_budget",
                  "created_at",
                  "updated_at",
                ].includes(key),
            ).length > 0 && (
              <>
                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Campos Adicionais</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(profileData)
                      .filter(
                        (key) =>
                          ![
                            "id",
                            "name",
                            "email",
                            "avatar_url",
                            "phone",
                            "country_code",
                            "family_code",
                            "associated_family_code",
                            "currency",
                            "show_cents",
                            "budget_alerts",
                            "monthly_budget",
                            "created_at",
                            "updated_at",
                          ].includes(key),
                      )
                      .map((key) => (
                        <div key={key} className="space-y-2">
                          <div className="text-sm text-muted-foreground">{key}</div>
                          <div className="bg-muted/30 p-2 rounded-md overflow-x-auto">
                            {typeof profileData[key] === "object"
                              ? JSON.stringify(profileData[key])
                              : String(profileData[key] ?? "null")}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-center p-4 bg-muted/20 rounded-md text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              Dados atualizados em: {new Date().toLocaleString("pt-BR")}
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 p-4 rounded-md">
            <p>Nenhum dado de perfil encontrado na base de dados.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
