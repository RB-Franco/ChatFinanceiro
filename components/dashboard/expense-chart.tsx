"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFinance } from "../finance-provider"
import { formatCurrency } from "@/utils/format-currency"

// Adicionar o import para o ícone e componentes de modal
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeDollarSign,
  CircleDollarSign,
  CreditCard,
  Eye,
  LineChart,
  ShoppingBag,
  Tag,
  Wallet,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface ExpenseChartProps {
  month: number
  year: number
  includeFuture?: boolean
}

// Mapeamento de ícones para categorias comuns
const categoryIcons: Record<string, React.ReactNode> = {
  alimentação: <ShoppingBag className="h-4 w-4" />,
  moradia: <CreditCard className="h-4 w-4" />,
  transporte: <Tag className="h-4 w-4" />,
  lazer: <LineChart className="h-4 w-4" />,
  saúde: <BadgeDollarSign className="h-4 w-4" />,
  educação: <CircleDollarSign className="h-4 w-4" />,
  // Adicione mais mapeamentos conforme necessário
}

export function ExpenseChart({ month, year, includeFuture = true }: ExpenseChartProps) {
  // Estado para controlar se estamos no cliente
  const [mounted, setMounted] = useState(false)
  const [chartData, setChartData] = useState<{ category: string; amount: number; color: string }[]>([])

  // Adicionar estado para controlar a modal e a categoria selecionada
  const [showSubcategories, setShowSubcategories] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Agora que estamos no cliente, podemos usar o hook useFinance com segurança
  const { getTransactionsByMonth } = useFinance()

  // Efeito para marcar quando o componente está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Função para gerar cores dinâmicas para categorias
  const generateColor = (index: number, total: number) => {
    // Gera cores HSL com matiz distribuído uniformemente
    const hue = (index * (360 / total)) % 360
    return `hsl(${hue}, 70%, 60%)`
  }

  // Efeito para processar os dados do gráfico
  useEffect(() => {
    if (!mounted) return

    // Obter transações filtradas pelo mês e ano
    const monthTransactions = getTransactionsByMonth(month, year)

    // Filtrar transações futuras se necessário
    const filteredTransactions = includeFuture
      ? monthTransactions
      : monthTransactions.filter((t) => t.status === "realizada")

    // Agrupar despesas por categoria
    const expensesByCategory = filteredTransactions
      .filter((t) => t.type === "despesa")
      .reduce(
        (acc, transaction) => {
          const category = transaction.category
          if (!acc[category]) {
            acc[category] = 0
          }
          acc[category] += Math.abs(transaction.amount)
          return acc
        },
        {} as Record<string, number>,
      )

    // Converter para o formato do gráfico
    const categories = Object.keys(expensesByCategory)

    // Se não houver categorias, limpar os dados do gráfico
    if (categories.length === 0) {
      setChartData([])
      return
    }

    const chartData = categories.map((category, index) => ({
      category,
      amount: expensesByCategory[category],
      color: generateColor(index, categories.length),
    }))

    // Ordenar por valor
    chartData.sort((a, b) => b.amount - a.amount)

    // Atualizar o estado com os novos dados
    setChartData(chartData)

    // Forçar a atualização da categoria selecionada se ela não existir mais nos novos dados
    if (selectedCategory && !categories.includes(selectedCategory)) {
      setSelectedCategory(null)
      setShowSubcategories(false)
    }
  }, [mounted, month, year, getTransactionsByMonth, includeFuture, selectedCategory])

  const total = chartData.reduce((sum, item) => sum + item.amount, 0)

  // Adicionar função para abrir a modal de subcategorias
  const handleShowSubcategories = (category: string) => {
    setSelectedCategory(category)
    setShowSubcategories(true)
  }

  // Função para obter ícone da categoria
  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase()
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (lowerCategory.includes(key)) {
        return icon
      }
    }
    return <Wallet className="h-4 w-4" /> // Ícone padrão
  }

  // Obter transações filtradas para a modal de subcategorias
  const getFilteredTransactions = () => {
    if (!mounted || !selectedCategory) return []

    const monthTransactions = getTransactionsByMonth(month, year)
    return monthTransactions.filter(
      (t) => t.type === "despesa" && t.category === selectedCategory && (includeFuture || t.status === "realizada"),
    )
  }

  // Early return if not mounted
  if (!mounted) {
    return null
  }

  return (
    <>
      <Card className="w-full dashboard-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Distribuição por Categoria</CardTitle>
            <Badge variant="outline" className="font-normal">
              {chartData.length} categorias
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Valores por categoria financeira</p>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="space-y-6 w-full dashboard-transition">
              {/* Lista de categorias */}
              <div className="space-y-4">
                {chartData.map((item, index) => (
                  <div key={item.category} className="group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center"
                          style={{ backgroundColor: `${item.color}20`, color: item.color }}
                        >
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium capitalize">{item.category}</span>
                            {index === 0 && <Badge className="bg-amber-500 hover:bg-amber-600">Maior gasto</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {total > 0 ? Math.round((item.amount / total) * 100) : 0}% do total
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(item.amount)}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.amount > 0 ? (
                              <span className="flex items-center gap-0.5 text-red-500">
                                <ArrowUpRight className="h-3 w-3" />
                                {Math.round((item.amount / total) * 100)}%
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5 text-green-500">
                                <ArrowDownRight className="h-3 w-3" />
                                0%
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleShowSubcategories(item.category)}
                          className="p-2 rounded-full hover:bg-muted transition-colors"
                          title="Ver subcategorias"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-in-out"
                        style={{
                          width: `${total > 0 ? (item.amount / total) * 100 : 0}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Dica */}
              <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-md">
                <p>
                  Clique no ícone <Eye className="h-3 w-3 inline" /> para ver detalhes das subcategorias.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mb-4 text-muted-foreground/50" />
              <p className="text-center">Nenhuma despesa registrada neste período</p>
              <p className="text-sm text-center mt-1">
                Adicione transações para visualizar a distribuição por categoria
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de subcategorias */}
      <Dialog open={showSubcategories} onOpenChange={setShowSubcategories}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {selectedCategory && (
                <>
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center"
                    style={{
                      backgroundColor: `${chartData.find((item) => item.category === selectedCategory)?.color}20`,
                      color: chartData.find((item) => item.category === selectedCategory)?.color || "#888",
                    }}
                  >
                    {getCategoryIcon(selectedCategory)}
                  </div>
                  <span className="capitalize">Detalhes da categoria: {selectedCategory}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {selectedCategory && (
              <div className="space-y-6">
                {(() => {
                  // Filtrar transações da categoria selecionada
                  const categoryTransactions = getFilteredTransactions()

                  // Calcular o total da categoria
                  const categoryTotal = categoryTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)

                  // Agrupar por subcategoria
                  const subcategories: Record<string, number> = {}
                  categoryTransactions.forEach((t) => {
                    const subcategory = t.subcategory || "Sem subcategoria"
                    if (!subcategories[subcategory]) {
                      subcategories[subcategory] = 0
                    }
                    subcategories[subcategory] += Math.abs(t.amount)
                  })

                  // Converter para array e ordenar
                  const subcategoryArray = Object.entries(subcategories)
                    .map(([name, amount]) => ({ name, amount }))
                    .sort((a, b) => b.amount - a.amount)

                  if (subcategoryArray.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-lg">
                        <Tag className="h-10 w-10 mb-3 text-muted-foreground/50" />
                        <p className="text-center text-muted-foreground">Nenhuma subcategoria encontrada</p>
                        <p className="text-center text-xs mt-2">
                          Adicione subcategorias ao registrar transações nesta categoria
                        </p>
                      </div>
                    )
                  }

                  // Obter a cor da categoria principal
                  const categoryColor =
                    chartData.find((item) => item.category === selectedCategory)?.color || "hsl(215, 70%, 60%)"

                  return (
                    <>
                      <div className="bg-muted/30 rounded-lg p-4 flex justify-between items-center mb-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Resumo da categoria</p>
                          <span className="font-bold">{formatCurrency(categoryTotal)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <p>
                            Esta categoria possui {subcategoryArray.length} subcategoria
                            {subcategoryArray.length !== 1 ? "s" : ""}
                          </p>
                          <p>{total > 0 ? Math.round((categoryTotal / total) * 100) : 0}% das despesas totais</p>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        {subcategoryArray.map(({ name, amount }, index) => {
                          const percentage = categoryTotal > 0 ? (amount / categoryTotal) * 100 : 0
                          // Gerar uma cor derivada da cor da categoria principal
                          const hslMatch = categoryColor.match(/hsl$$(\d+),\s*(\d+)%,\s*(\d+)%$$/)
                          let subcategoryColor = categoryColor
                          if (hslMatch) {
                            const h = Number.parseInt(hslMatch[1])
                            const s = Number.parseInt(hslMatch[2])
                            const l = Number.parseInt(hslMatch[3])
                            // Variar levemente a cor para cada subcategoria
                            subcategoryColor = `hsl(${h}, ${s}%, ${Math.max(30, Math.min(70, l + index * 5 - 10))}%)`
                          }

                          return (
                            <div key={name} className="bg-muted/10 p-3 rounded-lg hover:bg-muted/20 transition-colors">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded-md flex items-center justify-center"
                                    style={{
                                      backgroundColor: `${subcategoryColor}20`,
                                      color: subcategoryColor,
                                    }}
                                  >
                                    <Tag className="h-3.5 w-3.5" />
                                  </div>
                                  <span className="capitalize font-medium">{name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium">{formatCurrency(amount)}</span>
                                  <Badge variant="outline" className="font-normal">
                                    {Math.round(percentage)}%
                                  </Badge>
                                </div>
                              </div>
                              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 ease-in-out"
                                  style={{
                                    width: `${percentage}%`,
                                    backgroundColor: subcategoryColor,
                                  }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-6 pt-4 border-t text-sm text-muted-foreground">
                        <p className="flex items-center gap-1.5">
                          <Tag className="h-4 w-4" />
                          Dica: Adicione subcategorias ao registrar novas transações para um controle mais detalhado.
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
