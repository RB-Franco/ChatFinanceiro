"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useProfile } from "@/components/profile/profile-provider"
import { ChevronsUpDown, DollarSign, Wallet, Coins, BellRing, Percent } from "lucide-react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Check } from "lucide-react"
import { Separator } from "@/components/ui/separator"

// Lista de moedas disponíveis
const currencies = [
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "BRL", name: "Real Brasileiro", symbol: "R$", flag: "🇧🇷" },
  { code: "USD", name: "Dólar Americano", symbol: "$", flag: "🇺🇸" },
  { code: "GBP", name: "Libra Esterlina", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Iene Japonês", symbol: "¥", flag: "🇯🇵" },
  { code: "CNY", name: "Yuan Chinês", symbol: "¥", flag: "🇨🇳" },
  { code: "CHF", name: "Franco Suíço", symbol: "CHF", flag: "🇨🇭" },
  { code: "CAD", name: "Dólar Canadense", symbol: "C$", flag: "🇨🇦" },
  { code: "AUD", name: "Dólar Australiano", symbol: "A$", flag: "🇦🇺" },
  { code: "MXN", name: "Peso Mexicano", symbol: "$", flag: "🇲🇽" },
  { code: "INR", name: "Rupia Indiana", symbol: "₹", flag: "🇮🇳" },
  { code: "RUB", name: "Rublo Russo", symbol: "₽", flag: "🇷🇺" },
  { code: "ZAR", name: "Rand Sul-Africano", symbol: "R", flag: "🇿🇦" },
  { code: "TRY", name: "Lira Turca", symbol: "₺", flag: "🇹🇷" },
  { code: "SGD", name: "Dólar de Singapura", symbol: "S$", flag: "🇸🇬" },
  { code: "HKD", name: "Dólar de Hong Kong", symbol: "HK$", flag: "🇭🇰" },
  { code: "SEK", name: "Coroa Sueca", symbol: "kr", flag: "🇸🇪" },
  { code: "NOK", name: "Coroa Norueguesa", symbol: "kr", flag: "🇳🇴" },
  { code: "DKK", name: "Coroa Dinamarquesa", symbol: "kr", flag: "🇩🇰" },
  { code: "PLN", name: "Złoty Polonês", symbol: "zł", flag: "🇵🇱" },
]

export function FinancialSettings() {
  const [mounted, setMounted] = useState(false)
  const { profile, updateProfile } = useProfile()
  const { toast } = useToast()
  const [currencyOpen, setCurrencyOpen] = useState(false)

  const [formData, setFormData] = useState({
    currency: "EUR", // Padrão para Euro
    showCents: true,
    budgetAlerts: false,
    monthlyBudget: "",
  })

  useEffect(() => {
    setMounted(true)
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        currency: profile.currency || "EUR",
        showCents: profile.showCents !== undefined ? profile.showCents : true,
        budgetAlerts: profile.budgetAlerts || false,
        monthlyBudget: profile.monthlyBudget ? profile.monthlyBudget.toString() : "",
      }))
    }
  }, [profile])

  const handleCurrencyChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      currency: value,
    }))
  }

  const handleSwitchChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked,
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile) return

    // Atualizar informações financeiras
    updateProfile({
      ...profile,
      name: profile.name || "Usuário", // Garantir que name seja sempre uma string
      currency: formData.currency,
      showCents: formData.showCents,
      budgetAlerts: formData.budgetAlerts,
      monthlyBudget: formData.monthlyBudget ? Number.parseFloat(formData.monthlyBudget) : undefined,
    })

    toast({
      title: "Configurações financeiras atualizadas",
      description: "Suas preferências financeiras foram atualizadas com sucesso.",
    })
  }

  if (!mounted) return null

  return (
    <Card className="overflow-hidden border shadow-sm hover:shadow-md transition-all dashboard-transition fade-in">
      <CardHeader className="bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-950/20 dark:to-cyan-950/20 pb-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <CardTitle>Configurações Financeiras</CardTitle>
        </div>
        <CardDescription>Personalize suas preferências financeiras e de exibição de valores</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form id="financial-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currency" className="flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-muted-foreground" />
              Moeda Principal
            </Label>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={currencyOpen}
                className="w-full justify-between border-input/60"
                onClick={() => setCurrencyOpen(!currencyOpen)}
              >
                {formData.currency ? (
                  <>
                    <span className="flex items-center gap-2">
                      <span className="text-xl">{currencies.find((c) => c.code === formData.currency)?.flag}</span>
                      <span>{currencies.find((c) => c.code === formData.currency)?.name}</span>
                      <span className="text-muted-foreground">
                        ({currencies.find((c) => c.code === formData.currency)?.symbol} - {formData.currency})
                      </span>
                    </span>
                  </>
                ) : (
                  "Selecionar moeda"
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
              {currencyOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md">
                  <div className="max-h-[300px] overflow-auto p-1">
                    <div className="relative">
                      <input
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Buscar moeda..."
                        onChange={(e) => {
                          // Implementação simples de filtro se necessário
                        }}
                      />
                    </div>
                    <div className="mt-2">
                      {currencies.map((currency) => (
                        <div
                          key={currency.code}
                          className={`flex items-center w-full px-2 py-1.5 text-sm rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground ${
                            formData.currency === currency.code ? "bg-accent text-accent-foreground" : ""
                          }`}
                          onClick={() => {
                            handleCurrencyChange(currency.code)
                            setCurrencyOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.currency === currency.code ? "opacity-100" : "opacity-0",
                            )}
                          />
                          <span className="mr-2 text-xl">{currency.flag}</span>
                          <span>{currency.name}</span>
                          <span className="ml-auto text-muted-foreground">
                            {currency.symbol} ({currency.code})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Esta moeda será usada para exibir todos os valores financeiros no sistema.
            </p>
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="showCents" className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                Exibir centavos
              </Label>
              <p className="text-xs text-muted-foreground">Mostrar valores com casas decimais (ex: €10,50 vs €10)</p>
            </div>
            <Switch
              id="showCents"
              checked={formData.showCents}
              onCheckedChange={(checked) => handleSwitchChange("showCents", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-md bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="budgetAlerts" className="flex items-center gap-1.5">
                <BellRing className="h-3.5 w-3.5 text-muted-foreground" />
                Alertas de orçamento
              </Label>
              <p className="text-xs text-muted-foreground">
                Receber alertas quando as despesas se aproximarem do orçamento mensal
              </p>
            </div>
            <Switch
              id="budgetAlerts"
              checked={formData.budgetAlerts}
              onCheckedChange={(checked) => handleSwitchChange("budgetAlerts", checked)}
            />
          </div>

          {formData.budgetAlerts && (
            <div className="space-y-2 p-3 rounded-md bg-muted/30 border-l-2 border-primary">
              <Label htmlFor="monthlyBudget" className="flex items-center gap-1.5">
                <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                Orçamento Mensal
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="monthlyBudget"
                  name="monthlyBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthlyBudget}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className="pl-10 border-input/60 focus-visible:ring-teal-500/20"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Defina seu orçamento mensal para despesas. Você receberá alertas quando atingir 80% deste valor.
              </p>
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter className="bg-muted/20 py-3 flex justify-end">
        <Button type="submit" form="financial-form" className="bg-teal-600 hover:bg-teal-700">
          Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  )
}
