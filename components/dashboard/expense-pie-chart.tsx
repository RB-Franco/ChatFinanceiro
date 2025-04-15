"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTheme } from "next-themes"
import { formatCurrency } from "@/utils/format-currency"
import { Badge } from "@/components/ui/badge"
import { ArrowDownRight, ArrowUpRight, PieChart } from "lucide-react"

// Importar Chart.js apenas quando necessário
import type { Chart as ChartType, ChartOptions } from "chart.js"

// No início do componente, após as outras importações
import { useFinance, type Transaction } from "../finance-provider"

interface ExpensePieChartProps {
  month: number
  year: number
  includeFuture?: boolean
}

export function ExpensePieChart({ month, year, includeFuture = true }: ExpensePieChartProps) {
  // Estado para controlar se estamos no cliente
  const [mounted, setMounted] = useState(false)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<ChartType | null>(null)
  const { theme } = useTheme()
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  // Adicionar uma chave para forçar a recriação do gráfico quando o mês/ano mudar
  const chartKey = useMemo(
    () => `${month}-${year}-${includeFuture ? "future" : "no-future"}`,
    [month, year, includeFuture],
  )

  // Agora que estamos no cliente, podemos usar o hook useFinance com segurança
  const { getTransactionsByMonth, showFamilyTransactions } = useFinance()
  const [transactions, setTransactions] = useState<Transaction[]>([])

  // Função para gerar cores dinâmicas para categorias
  const generateColor = (index: number, total: number, alpha = 1) => {
    // Gera cores HSL com matiz distribuído uniformemente
    const hue = (index * (360 / total)) % 360
    return `hsla(${hue}, 85%, 65%, ${alpha})`
  }

  // Efeito para marcar quando o componente está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Buscar transações apenas quando necessário
  useEffect(() => {
    if (!mounted || !getTransactionsByMonth) return

    // Limpar o gráfico existente antes de buscar novas transações
    if (chartInstance.current) {
      chartInstance.current.destroy()
      chartInstance.current = null
    }

    // Buscar transações para o mês e ano selecionados
    const fetchedTransactions = getTransactionsByMonth(month, year)

    // Filtrar transações futuras se necessário
    const filteredTransactions = includeFuture
      ? fetchedTransactions
      : fetchedTransactions.filter((t) => t.status === "realizada")

    // Atualizar o estado com as novas transações
    setTransactions(filteredTransactions)

    // Forçar a limpeza de qualquer dado anterior
    if (filteredTransactions.length === 0) {
      setTotalIncome(0)
      setTotalExpenses(0)
      setTotalAmount(0)
    }
  }, [getTransactionsByMonth, month, year, includeFuture, mounted])

  // Calcular totais usando useMemo para evitar recálculos desnecessários
  const totals = useMemo(() => {
    if (!mounted || transactions.length === 0) {
      return { receitas: 0, despesas: 0, total: 0, categorias: {} }
    }

    const receitas = transactions.filter((t) => t.type === "receita").reduce((acc, t) => acc + Math.abs(t.amount), 0)

    // Agrupar despesas por categoria
    const despesasPorCategoria = transactions
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

    const totalDespesas = Object.values(despesasPorCategoria).reduce((sum, val) => sum + val, 0)
    const total = receitas + totalDespesas

    return {
      receitas,
      despesas: totalDespesas,
      total,
      categorias: despesasPorCategoria,
    }
  }, [transactions, mounted])

  // Atualizar estados com os totais calculados
  useEffect(() => {
    setTotalIncome(totals.receitas)
    setTotalExpenses(totals.despesas)
    setTotalAmount(totals.total)
  }, [totals])

  // Efeito para criar e atualizar o gráfico
  useEffect(() => {
    // Só executar se estiver montado no cliente
    if (!mounted) return

    // Limpar gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy()
      chartInstance.current = null
    }

    // Importar Chart.js dinamicamente apenas quando necessário
    const initChart = async () => {
      // Se não houver dados, não criar o gráfico e limpar qualquer gráfico existente
      if (!totals.categorias || Object.keys(totals.categorias).length === 0) {
        if (chartInstance.current) {
          chartInstance.current.destroy()
          chartInstance.current = null
        }
        return
      }

      const { Chart, registerables } = await import("chart.js")
      Chart.register(...registerables)

      // Preparar dados para o gráfico
      const labels = Object.keys(totals.categorias).map((cat) => cat.charAt(0).toUpperCase() + cat.slice(1))
      const data = Object.values(totals.categorias)

      // Gerar cores dinâmicas para cada categoria
      const backgroundColor: string[] = []
      const hoverBackgroundColor: string[] = []
      const borderColor: string[] = []

      // Adicionar cores dinâmicas para cada categoria de despesa
      const categorias = Object.keys(totals.categorias)
      categorias.forEach((_, index) => {
        backgroundColor.push(generateColor(index, categorias.length, 0.8))
        hoverBackgroundColor.push(generateColor(index, categorias.length, 1))
        borderColor.push(theme === "dark" ? "rgba(30, 30, 30, 0.8)" : "rgba(255, 255, 255, 0.8)")
      })

      // Configurações do gráfico
      const chartOptions: ChartOptions<"doughnut"> = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%", // Usar gráfico de rosca (doughnut) em vez de pizza
        layout: {
          padding: 20,
        },
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: theme === "dark" ? "#e5e7eb" : "#374151",
              usePointStyle: true,
              pointStyle: "circle",
              padding: 15,
              font: {
                size: 11,
                weight: "bold",
              },
              generateLabels: (chart) => {
                const data = chart.data
                if (data.labels && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const meta = chart.getDatasetMeta(0)
                    const style = meta.controller.getStyle(i)
                    const value = chart.data.datasets[0].data[i] as number
                    const total = chart.data.datasets[0].data.reduce((sum: number, val: number) => sum + val, 0)
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0

                    return {
                      text: `${label} (${percentage}%)`,
                      fillStyle: style.backgroundColor,
                      strokeStyle: style.backgroundColor, // Alterado para usar a mesma cor de fundo
                      lineWidth: 0, // Removida a borda do marcador da legenda
                      hidden: false,
                      index: i,
                    }
                  })
                }
                return []
              },
            },
          },
          tooltip: {
            backgroundColor: theme === "dark" ? "#1e1e1e" : "#ffffff",
            titleColor: theme === "dark" ? "#e5e7eb" : "#374151",
            bodyColor: theme === "dark" ? "#e5e7eb" : "#374151",
            borderColor: theme === "dark" ? "#525252" : "#c8c8c8",
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            boxPadding: 4,
            displayColors: true,
            boxWidth: 10,
            boxHeight: 10,
            usePointStyle: true,
            callbacks: {
              label: (context) => {
                const value = context.raw as number
                const total = data.reduce((a, b) => a + b, 0)
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0"
                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
              },
              labelTextColor: (context) => {
                return theme === "dark" ? "#e5e7eb" : "#374151"
              },
            },
          },
        },
        elements: {
          arc: {
            borderWidth: 0, // Alterado de 2 para 0 para remover as bordas
            borderRadius: 0, // Alterado de 4 para 0 para remover o arredondamento
            hoverBorderWidth: 1, // Reduzido de 3 para 1 para um efeito mais sutil
            hoverOffset: 10, // Mantido como estava
          },
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1000,
          easing: "easeOutQuart",
        },
      }

      // Criar o gráfico
      if (chartRef.current) {
        const ctx = chartRef.current.getContext("2d")
        if (ctx) {
          // Verificar novamente se o gráfico anterior foi destruído
          if (chartInstance.current) {
            chartInstance.current.destroy()
            chartInstance.current = null
          }

          // Criar o novo gráfico
          chartInstance.current = new Chart(ctx, {
            type: "doughnut",
            data: {
              labels,
              datasets: [
                {
                  data,
                  backgroundColor,
                  hoverBackgroundColor,
                  borderColor,
                  borderWidth: 2,
                  hoverBorderWidth: 3,
                  hoverOffset: 10,
                },
              ],
            },
            options: chartOptions,
          })
        }
      }
    }

    // Inicializar o gráfico com um pequeno atraso para garantir que o DOM esteja pronto
    const timer = setTimeout(() => {
      initChart()
    }, 50)

    // Limpar o gráfico e o timer quando o componente for desmontado ou as dependências mudarem
    return () => {
      clearTimeout(timer)
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [totals, theme, mounted, month, year, includeFuture, chartKey, showFamilyTransactions])

  // Renderizar um placeholder ou o gráfico
  return (
    <Card className="w-full dashboard-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>Distribuição de Despesas</CardTitle>
          <Badge variant="outline" className="font-normal">
            {
              Object.keys(
                transactions.reduce(
                  (acc, t) => {
                    if (t.type === "despesa") acc[t.category] = true
                    return acc
                  },
                  {} as Record<string, boolean>,
                ),
              ).length
            }{" "}
            categorias
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">Análise de gastos por categoria</p>
      </CardHeader>
      <CardContent>
        {!mounted ? (
          <div className="h-[350px] animate-pulse bg-muted rounded-md"></div>
        ) : (
          <div className="space-y-4 dashboard-transition">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/30 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Despesas</p>
                  <p className="text-xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p>
                  {totalAmount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {Math.round((totalExpenses / totalAmount) * 100)}% do total
                    </div>
                  )}
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                  <ArrowUpRight className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Receitas</p>
                  <p className="text-xl font-bold text-green-500">{formatCurrency(totalIncome)}</p>
                  {totalAmount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {Math.round((totalIncome / totalAmount) * 100)}% do total
                    </div>
                  )}
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500">
                  <ArrowDownRight className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </div>

            <div className="h-[350px] relative w-full dashboard-transition">
              <canvas
                ref={chartRef}
                key={`pie-chart-${month}-${year}-${includeFuture ? "with-future" : "no-future"}`}
              />
            </div>

            <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-md flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground/70" aria-hidden="true" />
              <p>Passe o mouse sobre as fatias do gráfico para ver detalhes de cada categoria.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
