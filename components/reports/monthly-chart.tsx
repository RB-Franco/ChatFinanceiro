"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useFinance } from "../finance-provider"
import { Chart, registerables } from "chart.js"
import { useTheme } from "next-themes"
import { formatCurrency } from "@/utils/format-currency"
import { ArrowDownRight, ArrowUpRight, LineChart, TrendingUp, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Registrar os componentes necessários do Chart.js
Chart.register(...registerables)

interface MonthlyChartProps {
  year: number
  includeFuture?: boolean
}

export function MonthlyChart({ year, includeFuture = true }: MonthlyChartProps) {
  // Estado para controlar se estamos no cliente
  const [mounted, setMounted] = useState(false)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const { theme } = useTheme()

  // Estados para armazenar dados de resumo
  const [totalReceitas, setTotalReceitas] = useState(0)
  const [totalDespesas, setTotalDespesas] = useState(0)
  const [mesMaiorReceita, setMesMaiorReceita] = useState({ mes: "", valor: 0 })
  const [mesMaiorDespesa, setMesMaiorDespesa] = useState({ mes: "", valor: 0 })

  // Agora que estamos no cliente, podemos usar o hook useFinance com segurança
  const { transactions, formatCurrencyWithUserSettings, showFamilyTransactions } = useFinance()

  // Efeito para marcar quando o componente está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Efeito para criar e atualizar o gráfico
  useEffect(() => {
    // Só executar se estiver montado no cliente
    if (!mounted) return

    // Limpar gráfico anterior se existir
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    const monthlyData: Record<string, { receitas: number; despesas: number }> = {}

    // Inicializar todos os meses
    monthNames.forEach((month) => {
      monthlyData[month] = { receitas: 0, despesas: 0 }
    })

    // Filtrar transações do ano e por status se necessário
    const filteredTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.date)
      const isCurrentYear = transactionDate.getFullYear() === year
      const statusOk = includeFuture || t.status === "realizada"
      return isCurrentYear && statusOk
    })

    // Preencher com dados reais
    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      const monthName = monthNames[date.getMonth()]

      if (transaction.type === "receita") {
        monthlyData[monthName].receitas += transaction.amount
      } else {
        monthlyData[monthName].despesas += Math.abs(transaction.amount)
      }
    })

    // Calcular totais e encontrar meses com maiores valores
    let totalRec = 0
    let totalDesp = 0
    let maxReceita = { mes: "", valor: 0 }
    let maxDespesa = { mes: "", valor: 0 }

    Object.entries(monthlyData).forEach(([month, values]) => {
      totalRec += values.receitas
      totalDesp += values.despesas

      if (values.receitas > maxReceita.valor) {
        maxReceita = { mes: month, valor: values.receitas }
      }

      if (values.despesas > maxDespesa.valor) {
        maxDespesa = { mes: month, valor: values.despesas }
      }
    })

    // Atualizar estados
    setTotalReceitas(totalRec)
    setTotalDespesas(totalDesp)
    setMesMaiorReceita(maxReceita)
    setMesMaiorDespesa(maxDespesa)

    // Converter para array
    const chartData = Object.entries(monthlyData).map(([month, values]) => ({
      month,
      receitas: values.receitas,
      despesas: values.despesas,
      saldo: values.receitas - values.despesas,
    }))

    // Preparar dados para o gráfico
    const labels = chartData.map((item) => item.month)
    const receitasData = chartData.map((item) => item.receitas)
    const despesasData = chartData.map((item) => item.despesas)
    const saldoData = chartData.map((item) => item.saldo)

    // Criar o gráfico
    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d")
      if (ctx) {
        // Criar gradientes para as áreas
        const receitaGradient = ctx.createLinearGradient(0, 0, 0, 400)
        receitaGradient.addColorStop(0, "rgba(34, 197, 94, 0.3)")
        receitaGradient.addColorStop(1, "rgba(34, 197, 94, 0.05)")

        const despesaGradient = ctx.createLinearGradient(0, 0, 0, 400)
        despesaGradient.addColorStop(0, "rgba(239, 68, 68, 0.3)")
        despesaGradient.addColorStop(1, "rgba(239, 68, 68, 0.05)")

        const saldoGradient = ctx.createLinearGradient(0, 0, 0, 400)
        saldoGradient.addColorStop(0, "rgba(59, 130, 246, 0.3)")
        saldoGradient.addColorStop(1, "rgba(59, 130, 246, 0.05)")

        chartInstance.current = new Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: "Receitas",
                data: receitasData,
                backgroundColor: receitaGradient,
                borderColor: "rgba(34, 197, 94, 1)",
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: "rgba(34, 197, 94, 1)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
              },
              {
                label: "Despesas",
                data: despesasData,
                backgroundColor: despesaGradient,
                borderColor: "rgba(239, 68, 68, 1)",
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: "rgba(239, 68, 68, 1)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
              },
              {
                label: "Saldo",
                data: saldoData,
                backgroundColor: saldoGradient,
                borderColor: "rgba(59, 130, 246, 1)",
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: "rgba(59, 130, 246, 1)",
                pointBorderColor: "#fff",
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: "index",
              intersect: false,
            },
            scales: {
              x: {
                grid: {
                  display: false,
                  color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                },
                ticks: {
                  color: theme === "dark" ? "#e5e7eb" : "#374151",
                  font: {
                    weight: 500,
                  },
                },
                border: {
                  display: false,
                },
              },
              y: {
                grid: {
                  color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                },
                ticks: {
                  color: theme === "dark" ? "#e5e7eb" : "#374151",
                  callback: (value) => formatCurrency(value as number).split(",")[0],
                  padding: 10,
                },
                border: {
                  display: false,
                },
              },
            },
            plugins: {
              legend: {
                position: "top",
                align: "end",
                labels: {
                  color: theme === "dark" ? "#e5e7eb" : "#374151",
                  usePointStyle: true,
                  pointStyle: "circle",
                  padding: 20,
                  font: {
                    size: 12,
                    weight: 500,
                  },
                },
              },
              tooltip: {
                backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                titleColor: theme === "dark" ? "#e5e7eb" : "#374151",
                bodyColor: theme === "dark" ? "#e5e7eb" : "#374151",
                borderColor: theme === "dark" ? "#374151" : "#e2e8f0",
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                boxPadding: 4,
                usePointStyle: true,
                callbacks: {
                  title: (tooltipItems) => {
                    // Formatar o título para mostrar o mês completo
                    const monthIndex = monthNames.indexOf(tooltipItems[0].label)
                    const fullMonthName = [
                      "Janeiro",
                      "Fevereiro",
                      "Março",
                      "Abril",
                      "Maio",
                      "Junho",
                      "Julho",
                      "Agosto",
                      "Setembro",
                      "Outubro",
                      "Novembro",
                      "Dezembro",
                    ][monthIndex]
                    return `${fullMonthName} de ${year}`
                  },
                  label: (context) => {
                    let label = context.dataset.label || ""
                    if (label) {
                      label += ": "
                    }
                    if (context.parsed.y !== null) {
                      label += formatCurrencyWithUserSettings(context.parsed.y)
                    }
                    return label
                  },
                },
              },
            },
            animation: {
              duration: 1500,
              easing: "easeOutQuart",
            },
          },
        })
      }
    }

    // Limpar o gráfico quando o componente for desmontado
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [mounted, year, theme, transactions, includeFuture, formatCurrencyWithUserSettings, showFamilyTransactions])

  const formatValue = (value: number) => {
    return value > 0 ? formatCurrencyWithUserSettings(value) : "-"
  }

  // Renderizar um placeholder ou o gráfico
  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <LineChart className="h-5 w-5 text-primary" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>Análise mensal de receitas, despesas e saldo em {year}</CardDescription>
          </div>
          <Badge variant="outline" className="font-normal self-start md:self-center">
            {includeFuture ? "Incluindo transações futuras" : "Apenas transações realizadas"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {!mounted ? (
          <div className="h-[400px] animate-pulse bg-muted rounded-md"></div>
        ) : (
          <div className="space-y-6 dashboard-transition fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card de Total Receitas */}
              <div
                className="relative group cursor-help h-full"
                onMouseEnter={(e) => {
                  const tooltip = document.createElement("div")
                  tooltip.className =
                    "absolute z-[9999] p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-72 transform -translate-y-full"
                  tooltip.innerHTML = `
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center gap-2">
                        <div class="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-green-600 dark:text-green-400">
                            <path d="M18 15l-6-6-6 6"/>
                          </svg>
                        </div>
                        <p class="font-semibold text-green-600 dark:text-green-400">Total de Receitas</p>
                      </div>
                      <div class="flex justify-between items-center mt-1">
                        <p class="text-sm font-medium">Valor total:</p>
                        <p class="font-bold text-green-600 dark:text-green-400">${formatCurrencyWithUserSettings(totalReceitas)}</p>
                      </div>
                      <p class="text-xs text-gray-600 dark:text-gray-300">
                        Soma de todas as entradas financeiras no ano ${year}.
                      </p>
                      ${
                        totalReceitas > 0 && totalDespesas !== 0
                          ? `
                      <div class="mt-1 p-2 bg-green-100/50 dark:bg-green-900/20 rounded-md">
                        <p class="text-xs text-green-700 dark:text-green-300">
                          As receitas representam ${Math.round((totalReceitas / (totalReceitas + Math.abs(totalDespesas))) * 100)}% do volume total de transações.
                        </p>
                      </div>
                      `
                          : ""
                      }
                    </div>
                  `
                  tooltip.id = "tooltip-receitas-mensal"
                  document.body.appendChild(tooltip)

                  const rect = e.currentTarget.getBoundingClientRect()
                  tooltip.style.left = `${rect.left + rect.width / 2 - 144}px` // Centralizar tooltip (largura 288px/2)
                  tooltip.style.top = `${rect.top - 10}px`
                }}
                onMouseLeave={() => {
                  const tooltip = document.getElementById("tooltip-receitas-mensal")
                  if (tooltip) tooltip.remove()
                }}
              >
                <div className="bg-muted/30 rounded-lg p-4 flex justify-between items-center h-full hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col justify-between h-full">
                    <p className="text-sm font-medium text-muted-foreground">Total Receitas</p>
                    <p className="text-xl font-bold text-green-500 min-h-[28px]">
                      {formatCurrencyWithUserSettings(totalReceitas)}
                    </p>
                    <div className="min-h-[16px]"></div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500">
                    <ArrowDownRight className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {/* Card de Total Despesas */}
              <div
                className="relative group cursor-help h-full"
                onMouseEnter={(e) => {
                  const tooltip = document.createElement("div")
                  tooltip.className =
                    "absolute z-[9999] p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-72 transform -translate-y-full"
                  tooltip.innerHTML = `
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center gap-2">
                        <div class="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-red-600 dark:text-red-400">
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </div>
                        <p class="font-semibold text-red-600 dark:text-red-400">Total de Despesas</p>
                      </div>
                      <div class="flex justify-between items-center mt-1">
                        <p class="text-sm font-medium">Valor total:</p>
                        <p class="font-bold text-red-600 dark:text-red-400">${formatCurrencyWithUserSettings(Math.abs(totalDespesas))}</p>
                      </div>
                      <p class="text-xs text-gray-600 dark:text-gray-300">
                        Soma de todas as saídas financeiras no ano ${year}.
                      </p>
                      ${
                        totalDespesas !== 0
                          ? `
                      <div class="mt-1 p-2 bg-red-100/50 dark:bg-red-900/20 rounded-md">
                        <p class="text-xs text-red-700 dark:text-red-300">
                          As despesas representam ${Math.round((Math.abs(totalDespesas) / (totalReceitas + Math.abs(totalDespesas))) * 100)}% do volume total de transações.
                        </p>
                      </div>
                      `
                          : ""
                      }
                    </div>
                  `
                  tooltip.id = "tooltip-despesas-mensal"
                  document.body.appendChild(tooltip)

                  const rect = e.currentTarget.getBoundingClientRect()
                  tooltip.style.left = `${rect.left + rect.width / 2 - 144}px` // Centralizar tooltip (largura 288px/2)
                  tooltip.style.top = `${rect.top - 10}px`
                }}
                onMouseLeave={() => {
                  const tooltip = document.getElementById("tooltip-despesas-mensal")
                  if (tooltip) tooltip.remove()
                }}
              >
                <div className="bg-muted/30 rounded-lg p-4 flex justify-between items-center h-full hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col justify-between h-full">
                    <p className="text-sm font-medium text-muted-foreground">Total Despesas</p>
                    <p className="text-xl font-bold text-red-500 min-h-[28px]">
                      {formatCurrencyWithUserSettings(Math.abs(totalDespesas))}
                    </p>
                    <div className="min-h-[16px]"></div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                    <ArrowUpRight className="h-6 w-6" aria-hidden="true" />
                  </div>
                </div>
              </div>

              {/* Card de Maior Receita */}
              <div
                className="relative group cursor-help h-full"
                onMouseEnter={(e) => {
                  const tooltip = document.createElement("div")
                  tooltip.className =
                    "absolute z-[9999] p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-72 transform -translate-y-full"
                  tooltip.innerHTML = `
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center gap-2">
                        <div class="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-green-600 dark:text-green-400">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                            <polyline points="17 6 23 6 23 12"></polyline>
                          </svg>
                        </div>
                        <p class="font-semibold text-green-600 dark:text-green-400">Maior Receita do Ano</p>
                      </div>
                      <div class="flex justify-between items-center mt-1">
                        <p class="text-sm font-medium">Valor:</p>
                        <p class="font-bold text-green-600 dark:text-green-400">${formatCurrencyWithUserSettings(mesMaiorReceita.valor)}</p>
                      </div>
                      ${
                        mesMaiorReceita.mes
                          ? `
                      <p class="text-xs text-gray-600 dark:text-gray-300">
                        Esta receita foi registrada no mês de ${mesMaiorReceita.mes}.
                      </p>
                      <div class="mt-1 p-2 bg-green-100/50 dark:bg-green-900/20 rounded-md">
                        <p class="text-xs text-green-700 dark:text-green-300">
                          Representa ${Math.round((mesMaiorReceita.valor / totalReceitas) * 100)}% do total de receitas do ano.
                        </p>
                      </div>
                      `
                          : ""
                      }
                    </div>
                  `
                  tooltip.id = "tooltip-maior-receita-mensal"
                  document.body.appendChild(tooltip)

                  const rect = e.currentTarget.getBoundingClientRect()
                  tooltip.style.left = `${rect.left + rect.width / 2 - 144}px` // Centralizar tooltip (largura 288px/2)
                  tooltip.style.top = `${rect.top - 10}px`
                }}
                onMouseLeave={() => {
                  const tooltip = document.getElementById("tooltip-maior-receita-mensal")
                  if (tooltip) tooltip.remove()
                }}
              >
                <div className="bg-muted/30 rounded-lg p-4 flex justify-between items-center h-full hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col justify-between h-full">
                    <p className="text-sm font-medium text-muted-foreground">Maior Receita</p>
                    <p className="text-xl font-bold text-green-500 min-h-[28px]">
                      {formatValue(mesMaiorReceita.valor)}
                    </p>
                    {mesMaiorReceita.mes && (
                      <p className="text-xs text-muted-foreground min-h-[16px]">Mês de {mesMaiorReceita.mes}</p>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Card de Maior Despesa */}
              <div
                className="relative group cursor-help h-full"
                onMouseEnter={(e) => {
                  const tooltip = document.createElement("div")
                  tooltip.className =
                    "absolute z-[9999] p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-72 transform -translate-y-full"
                  tooltip.innerHTML = `
                    <div class="flex flex-col gap-2">
                      <div class="flex items-center gap-2">
                        <div class="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-red-600 dark:text-red-400">
                            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
                            <polyline points="17 18 23 18 23 12"></polyline>
                          </svg>
                        </div>
                        <p class="font-semibold text-red-600 dark:text-red-400">Maior Despesa do Ano</p>
                      </div>
                      <div class="flex justify-between items-center mt-1">
                        <p class="text-sm font-medium">Valor:</p>
                        <p class="font-bold text-red-600 dark:text-red-400">${formatCurrencyWithUserSettings(mesMaiorDespesa.valor)}</p>
                      </div>
                      ${
                        mesMaiorDespesa.mes
                          ? `
                      <p class="text-xs text-gray-600 dark:text-gray-300">
                        Esta despesa foi registrada no mês de ${mesMaiorDespesa.mes}.
                      </p>
                      <div class="mt-1 p-2 bg-red-100/50 dark:bg-red-900/20 rounded-md">
                        <p class="text-xs text-red-700 dark:text-red-300">
                          Representa ${Math.round((mesMaiorDespesa.valor / Math.abs(totalDespesas)) * 100)}% do total de despesas do ano.
                        </p>
                      </div>
                      `
                          : ""
                      }
                    </div>
                  `
                  tooltip.id = "tooltip-maior-despesa-mensal"
                  document.body.appendChild(tooltip)

                  const rect = e.currentTarget.getBoundingClientRect()
                  tooltip.style.left = `${rect.left + rect.width / 2 - 144}px` // Centralizar tooltip (largura 288px/2)
                  tooltip.style.top = `${rect.top - 10}px`
                }}
                onMouseLeave={() => {
                  const tooltip = document.getElementById("tooltip-maior-despesa-mensal")
                  if (tooltip) tooltip.remove()
                }}
              >
                <div className="bg-muted/30 rounded-lg p-4 flex justify-between items-center h-full hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col justify-between h-full">
                    <p className="text-sm font-medium text-muted-foreground">Maior Despesa</p>
                    <p className="text-xl font-bold text-red-500 min-h-[28px]">{formatValue(mesMaiorDespesa.valor)}</p>
                    {mesMaiorDespesa.mes && (
                      <p className="text-xs text-muted-foreground min-h-[16px]">Mês de {mesMaiorDespesa.mes}</p>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                    <TrendingDown className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[350px] relative w-full">
              <canvas
                ref={chartRef}
                key={`monthly-chart-${year}-${includeFuture ? "with-future" : "no-future"}-${showFamilyTransactions ? "family" : "personal"}`}
              />
            </div>

            <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-md flex items-center gap-2">
              <LineChart className="h-4 w-4 text-muted-foreground/70" />
              <p>
                O gráfico mostra a evolução mensal de receitas, despesas e saldo ao longo do ano. Passe o mouse sobre as
                linhas para ver detalhes.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
