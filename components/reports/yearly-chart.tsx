"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useFinance } from "../finance-provider"
import { Chart, registerables } from "chart.js"
import { useTheme } from "next-themes"
import { formatCurrency } from "@/utils/format-currency"
import { ArrowDownRight, ArrowUpRight, BarChart4, TrendingUp, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Registrar os componentes necessários do Chart.js
Chart.register(...registerables)

interface YearlyChartProps {
  includeFuture?: boolean
}

export function YearlyChart({ includeFuture = true }: YearlyChartProps) {
  // Estado para controlar se estamos no cliente
  const [mounted, setMounted] = useState(false)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const { theme } = useTheme()

  // Estados para armazenar dados de resumo
  const [totalReceitas, setTotalReceitas] = useState(0)
  const [totalDespesas, setTotalDespesas] = useState(0)
  const [anoMaiorReceita, setAnoMaiorReceita] = useState({ ano: 0, valor: 0 })
  const [anoMaiorDespesa, setAnoMaiorDespesa] = useState({ ano: 0, valor: 0 })
  const [anoMaiorSaldo, setAnoMaiorSaldo] = useState({ ano: 0, valor: 0 })
  const [tendencia, setTendencia] = useState<"up" | "down" | "stable">("stable")

  // Agora que estamos no cliente, podemos usar o hook useFinance com segurança
  const { transactions, formatCurrencyWithUserSettings } = useFinance()

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

    // Filtrar transações por status se necessário
    const filteredTransactions = includeFuture ? transactions : transactions.filter((t) => t.status === "realizada")

    // Encontrar todos os anos únicos nas transações
    const years = [...new Set(filteredTransactions.map((t) => new Date(t.date).getFullYear()))]

    // Inicializar dados anuais
    const yearlyData: Record<number, { receitas: number; despesas: number; saldo: number }> = {}
    years.forEach((year) => {
      yearlyData[year] = { receitas: 0, despesas: 0, saldo: 0 }
    })

    // Preencher com dados reais
    filteredTransactions.forEach((transaction) => {
      const year = new Date(transaction.date).getFullYear()

      if (transaction.type === "receita") {
        yearlyData[year].receitas += transaction.amount
      } else {
        yearlyData[year].despesas += Math.abs(transaction.amount)
      }

      // Calcular saldo
      yearlyData[year].saldo = yearlyData[year].receitas - yearlyData[year].despesas
    })

    // Calcular totais e encontrar anos com maiores valores
    let totalRec = 0
    let totalDesp = 0
    let maxReceita = { ano: 0, valor: 0 }
    let maxDespesa = { ano: 0, valor: 0 }
    let maxSaldo = { ano: 0, valor: Number.NEGATIVE_INFINITY }

    Object.entries(yearlyData).forEach(([yearStr, values]) => {
      const year = Number.parseInt(yearStr)
      totalRec += values.receitas
      totalDesp += values.despesas

      if (values.receitas > maxReceita.valor) {
        maxReceita = { ano: year, valor: values.receitas }
      }

      if (values.despesas > maxDespesa.valor) {
        maxDespesa = { ano: year, valor: values.despesas }
      }

      if (values.saldo > maxSaldo.valor) {
        maxSaldo = { ano: year, valor: values.saldo }
      }
    })

    // Determinar tendência
    if (years.length >= 2) {
      const sortedYears = [...years].sort((a, b) => a - b)
      const lastYear = sortedYears[sortedYears.length - 1]
      const prevYear = sortedYears[sortedYears.length - 2]

      if (yearlyData[lastYear]?.saldo > yearlyData[prevYear]?.saldo) {
        setTendencia("up")
      } else if (yearlyData[lastYear]?.saldo < yearlyData[prevYear]?.saldo) {
        setTendencia("down")
      } else {
        setTendencia("stable")
      }
    }

    // Atualizar estados
    setTotalReceitas(totalRec)
    setTotalDespesas(totalDesp)
    setAnoMaiorReceita(maxReceita)
    setAnoMaiorDespesa(maxDespesa)
    setAnoMaiorSaldo(maxSaldo)

    // Converter para array e ordenar por ano
    const chartData = Object.entries(yearlyData)
      .map(([year, values]) => ({
        year: Number.parseInt(year),
        receitas: values.receitas,
        despesas: values.despesas,
        saldo: values.saldo,
      }))
      .sort((a, b) => a.year - b.year)

    // Preparar dados para o gráfico
    const labels = chartData.map((item) => item.year.toString())
    const receitasData = chartData.map((item) => item.receitas)
    const despesasData = chartData.map((item) => item.despesas)
    const saldoData = chartData.map((item) => item.saldo)

    // Criar o gráfico
    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d")
      if (ctx) {
        // Criar gradientes para as barras
        const receitaGradient = ctx.createLinearGradient(0, 0, 0, 400)
        receitaGradient.addColorStop(0, "rgba(34, 197, 94, 0.8)")
        receitaGradient.addColorStop(1, "rgba(34, 197, 94, 0.2)")

        const despesaGradient = ctx.createLinearGradient(0, 0, 0, 400)
        despesaGradient.addColorStop(0, "rgba(239, 68, 68, 0.8)")
        despesaGradient.addColorStop(1, "rgba(239, 68, 68, 0.2)")

        const saldoGradient = ctx.createLinearGradient(0, 0, 0, 400)
        saldoGradient.addColorStop(0, "rgba(59, 130, 246, 0.8)")
        saldoGradient.addColorStop(1, "rgba(59, 130, 246, 0.2)")

        chartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Receitas",
                data: receitasData,
                backgroundColor: receitaGradient,
                borderColor: "rgba(34, 197, 94, 1)",
                borderWidth: 1,
                borderRadius: 6,
                barPercentage: 0.25,
                categoryPercentage: 0.9,
                order: 2,
              },
              {
                label: "Despesas",
                data: despesasData,
                backgroundColor: despesaGradient,
                borderColor: "rgba(239, 68, 68, 1)",
                borderWidth: 1,
                borderRadius: 6,
                barPercentage: 0.25,
                categoryPercentage: 0.9,
                order: 3,
              },
              {
                label: "Saldo",
                data: saldoData,
                backgroundColor: saldoGradient,
                borderColor: "rgba(59, 130, 246, 1)",
                borderWidth: 1,
                borderRadius: 6,
                barPercentage: 0.25,
                categoryPercentage: 0.9,
                type: "bar",
                order: 1,
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
                    weight: "500",
                    size: 13,
                  },
                },
                border: {
                  display: false,
                },
              },
              y: {
                grid: {
                  color: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
                  drawBorder: false,
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
                  pointStyle: "rect",
                  padding: 20,
                  font: {
                    size: 12,
                    weight: "500",
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
                    return `Ano de ${tooltipItems[0].label}`
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
                  afterLabel: (context) => {
                    // Adicionar informação de porcentagem para receitas e despesas
                    if (context.dataset.label === "Receitas" || context.dataset.label === "Despesas") {
                      const total = context.dataset.label === "Receitas" ? totalRec : totalDesp
                      if (total > 0) {
                        const percentage = ((context.parsed.y / total) * 100).toFixed(1)
                        return `${percentage}% do total de ${context.dataset.label.toLowerCase()}`
                      }
                    }
                    return ""
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
  }, [mounted, theme, transactions, includeFuture, formatCurrencyWithUserSettings])

  // Renderizar um placeholder ou o gráfico
  return (
    <Card className="w-full shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <BarChart4 className="h-5 w-5 text-primary" />
              Comparativo Anual
            </CardTitle>
            <CardDescription>Análise comparativa de receitas, despesas e saldo por ano</CardDescription>
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
            Soma de todas as entradas financeiras em todos os anos registrados.
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
                  tooltip.id = "tooltip-receitas-anual"
                  document.body.appendChild(tooltip)

                  const rect = e.currentTarget.getBoundingClientRect()
                  tooltip.style.left = `${rect.left + rect.width / 2 - 144}px` // Centralizar tooltip (largura 288px/2)
                  tooltip.style.top = `${rect.top - 10}px`
                }}
                onMouseLeave={() => {
                  const tooltip = document.getElementById("tooltip-receitas-anual")
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
                    <ArrowDownRight className="h-6 w-6" />
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
            <p class="font-bold text-red-600 dark:text-red-400">${formatCurrencyWithUserSettings(totalDespesas)}</p>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-300">
            Soma de todas as saídas financeiras em todos os anos registrados.
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
                  tooltip.id = "tooltip-despesas-anual"
                  document.body.appendChild(tooltip)

                  const rect = e.currentTarget.getBoundingClientRect()
                  tooltip.style.left = `${rect.left + rect.width / 2 - 144}px` // Centralizar tooltip (largura 288px/2)
                  tooltip.style.top = `${rect.top - 10}px`
                }}
                onMouseLeave={() => {
                  const tooltip = document.getElementById("tooltip-despesas-anual")
                  if (tooltip) tooltip.remove()
                }}
              >
                <div className="bg-muted/30 rounded-lg p-4 flex justify-between items-center h-full hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col justify-between h-full">
                    <p className="text-sm font-medium text-muted-foreground">Total Despesas</p>
                    <p className="text-xl font-bold text-red-500 min-h-[28px]">
                      {formatCurrencyWithUserSettings(totalDespesas)}
                    </p>
                    <div className="min-h-[16px]"></div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                    <ArrowUpRight className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Card de Melhor Saldo */}
              <div
                className="relative group cursor-help h-full"
                onMouseEnter={(e) => {
                  const tooltip = document.createElement("div")
                  tooltip.className =
                    "absolute z-[9999] p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-72 transform -translate-y-full"
                  tooltip.innerHTML = `
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-blue-600 dark:text-blue-400">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </div>
            <p class="font-semibold text-blue-600 dark:text-blue-400">Melhor Saldo Anual</p>
          </div>
          <div class="flex justify-between items-center mt-1">
            <p class="text-sm font-medium">Valor:</p>
            <p class="font-bold text-blue-600 dark:text-blue-400">${anoMaiorSaldo.valor > Number.NEGATIVE_INFINITY ? formatCurrencyWithUserSettings(anoMaiorSaldo.valor) : "-"}</p>
          </div>
          ${
            anoMaiorSaldo.ano > 0
              ? `
          <p class="text-xs text-gray-600 dark:text-gray-300">
            Este saldo foi registrado no ano de ${anoMaiorSaldo.ano}.
          </p>
          <div class="mt-1 p-2 bg-blue-100/50 dark:bg-blue-900/20 rounded-md">
            <p class="text-xs text-blue-700 dark:text-blue-300">
              Este foi o ano com melhor desempenho financeiro, com um saldo positivo significativo.
            </p>
          </div>
          `
              : ""
          }
        </div>
      `
                  tooltip.id = "tooltip-melhor-saldo"
                  document.body.appendChild(tooltip)

                  const rect = e.currentTarget.getBoundingClientRect()
                  tooltip.style.left = `${rect.left + rect.width / 2 - 144}px` // Centralizar tooltip (largura 288px/2)
                  tooltip.style.top = `${rect.top - 10}px`
                }}
                onMouseLeave={() => {
                  const tooltip = document.getElementById("tooltip-melhor-saldo")
                  if (tooltip) tooltip.remove()
                }}
              >
                <div className="bg-muted/30 rounded-lg p-4 flex justify-between items-center h-full hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col justify-between h-full">
                    <p className="text-sm font-medium text-muted-foreground">Melhor Saldo</p>
                    <p className="text-xl font-bold text-blue-500 min-h-[28px]">
                      {anoMaiorSaldo.valor > Number.NEGATIVE_INFINITY
                        ? formatCurrencyWithUserSettings(anoMaiorSaldo.valor)
                        : "-"}
                    </p>
                    {anoMaiorSaldo.ano > 0 && (
                      <p className="text-xs text-muted-foreground min-h-[16px]">Ano de {anoMaiorSaldo.ano}</p>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Card de Tendência */}
              <div
                className="relative group cursor-help h-full"
                onMouseEnter={(e) => {
                  const tooltip = document.createElement("div")
                  tooltip.className =
                    "absolute z-[9999] p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 w-72 transform -translate-y-full"
                  tooltip.innerHTML = `
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-full ${
              tendencia === "up"
                ? "bg-green-100 dark:bg-green-900/30"
                : tendencia === "down"
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-blue-100 dark:bg-blue-900/30"
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="${
                tendencia === "up"
                  ? "text-green-600 dark:text-green-400"
                  : tendencia === "down"
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
              }">
                ${
                  tendencia === "up"
                    ? '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline>'
                    : tendencia === "down"
                      ? '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline>'
                      : '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>'
                }
              </svg>
            </div>
            <p class="font-semibold ${
              tendencia === "up"
                ? "text-green-600 dark:text-green-400"
                : tendencia === "down"
                  ? "text-red-600 dark:text-red-400"
                  : "text-blue-600 dark:text-blue-400"
            }">Tendência Financeira</p>
          </div>
          <div class="flex justify-between items-center mt-1">
            <p class="text-sm font-medium">Status:</p>
            <p class="font-bold ${
              tendencia === "up"
                ? "text-green-600 dark:text-green-400"
                : tendencia === "down"
                  ? "text-red-600 dark:text-red-400"
                  : "text-blue-600 dark:text-blue-400"
            }">${tendencia === "up" ? "Positiva" : tendencia === "down" ? "Negativa" : "Estável"}</p>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-300">
            Comparação do saldo do último ano com o ano anterior.
          </p>
          <div class="mt-1 p-2 ${
            tendencia === "up"
              ? "bg-green-100/50 dark:bg-green-900/20"
              : tendencia === "down"
                ? "bg-red-100/50 dark:bg-red-900/20"
                : "bg-blue-100/50 dark:bg-blue-900/20"
          } rounded-md">
            <p class="text-xs ${
              tendencia === "up"
                ? "text-green-700 dark:text-green-300"
                : tendencia === "down"
                  ? "text-red-700 dark:text-red-300"
                  : "text-blue-700 dark:text-blue-300"
            }">
              ${
                tendencia === "up"
                  ? "Seus resultados financeiros estão melhorando em comparação ao ano anterior."
                  : tendencia === "down"
                    ? "Seus resultados financeiros pioraram em comparação ao ano anterior."
                    : "Seus resultados financeiros se mantiveram estáveis em comparação ao ano anterior."
              }
            </p>
          </div>
        </div>
      `
                  tooltip.id = "tooltip-tendencia"
                  document.body.appendChild(tooltip)

                  const rect = e.currentTarget.getBoundingClientRect()
                  tooltip.style.left = `${rect.left + rect.width / 2 - 144}px` // Centralizar tooltip (largura 288px/2)
                  tooltip.style.top = `${rect.top - 10}px`
                }}
                onMouseLeave={() => {
                  const tooltip = document.getElementById("tooltip-tendencia")
                  if (tooltip) tooltip.remove()
                }}
              >
                <div className="bg-muted/30 rounded-lg p-4 flex justify-between items-center h-full hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col justify-between h-full">
                    <p className="text-sm font-medium text-muted-foreground">Tendência</p>
                    <p
                      className={`text-xl font-bold min-h-[28px] ${
                        tendencia === "up" ? "text-green-500" : tendencia === "down" ? "text-red-500" : "text-blue-500"
                      }`}
                    >
                      {tendencia === "up" ? "Positiva" : tendencia === "down" ? "Negativa" : "Estável"}
                    </p>
                    <p className="text-xs text-muted-foreground min-h-[16px]">Comparado ao ano anterior</p>
                  </div>
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      tendencia === "up"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-500"
                        : tendencia === "down"
                          ? "bg-red-100 dark:bg-red-900/30 text-red-500"
                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-500"
                    }`}
                  >
                    {tendencia === "up" ? (
                      <TrendingUp className="h-6 w-6" />
                    ) : tendencia === "down" ? (
                      <TrendingDown className="h-6 w-6" />
                    ) : (
                      <BarChart4 className="h-6 w-6" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[350px] relative w-full">
              <canvas ref={chartRef} key={`yearly-chart-${includeFuture ? "with-future" : "no-future"}`} />
            </div>

            <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-md flex items-center gap-2">
              <BarChart4 className="h-4 w-4 text-muted-foreground/70" />
              <p>
                O gráfico mostra a comparação anual de receitas (barras verdes), despesas (barras vermelhas) e saldo
                (barras azuis). Passe o mouse sobre os elementos para ver detalhes.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
