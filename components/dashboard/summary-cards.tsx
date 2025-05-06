"use client"

import { CreditCard, ArrowUpCircle, ArrowDownCircle, DollarSign, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useFinance } from "../finance-provider"
import { useEffect, useState } from "react"
import React from "react"
// Adicione o import no topo do arquivo
import { AnimatedCounter } from "@/components/ui/animated-counter"
// Adicione estas importações no topo do arquivo
import { createPortal } from "react-dom"
import { useRef } from "react"

interface SummaryCardsProps {
  month: number
  year: number
  includeFuture?: boolean
}

export function SummaryCards({ month, year, includeFuture = true }: SummaryCardsProps) {
  // Estado para controlar se estamos no cliente
  const [mounted, setMounted] = useState(false)

  // Agora que estamos no cliente, podemos usar o hook useFinance com segurança
  const { getTransactionsByMonth, getTransactionsByStatus, formatCurrencyWithUserSettings } = useFinance()

  // Efeito para marcar quando o componente está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Calcular totais com base nas transações filtradas
  const { receitas, despesas, saldo, totalTransacoes, totalFuturas } = React.useMemo(() => {
    if (!mounted) return { receitas: 0, despesas: 0, saldo: 0, totalTransacoes: 0, totalFuturas: 0 }

    const filteredTransactions = getTransactionsByMonth(month, year)

    // Filtrar transações futuras apenas para o mês e ano selecionados
    const futureTransactions = getTransactionsByStatus("futura").filter((t) => {
      const transDate = new Date(t.date)
      return transDate.getMonth() === month && transDate.getFullYear() === year
    })

    const receitas = filteredTransactions
      .filter((t) => t.type === "receita" && (includeFuture || t.status === "realizada"))
      .reduce((acc, t) => acc + t.amount, 0)

    const despesas = filteredTransactions
      .filter((t) => t.type === "despesa" && (includeFuture || t.status === "realizada"))
      .reduce((acc, t) => acc + t.amount, 0)

    const saldo = receitas + despesas // despesas já são negativas
    const totalTransacoes = filteredTransactions.filter((t) => includeFuture || t.status === "realizada").length
    const totalFuturas = futureTransactions.length

    return { receitas, despesas, saldo, totalTransacoes, totalFuturas }
  }, [mounted, month, year, includeFuture, getTransactionsByMonth, getTransactionsByStatus])

  // Não renderizar nada durante a renderização do servidor
  if (!mounted) {
    return (
      <div className="grid gap-4 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="overflow-hidden border-l-4 border-l-gray-300 transition-all">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className="flex-1 p-3 overflow-hidden">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-6 w-16 bg-muted animate-pulse rounded mb-2"></div>
                  <div className="h-3 w-20 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="bg-muted w-10 flex-shrink-0"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Modifique o componente SummaryCard para usar portal nos tooltips
  const SummaryCard = ({
    id,
    title,
    value,
    subtitle,
    icon,
    color,
    tooltipTitle,
    tooltipContent,
    tooltipIcon,
  }: {
    id: string
    title: string
    value: React.ReactNode
    subtitle: React.ReactNode
    icon: React.ReactNode
    color: string
    tooltipTitle: string
    tooltipContent: React.ReactNode
    tooltipIcon?: React.ReactNode
  }) => {
    const [showTooltip, setShowTooltip] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })

    useEffect(() => {
      setIsMounted(true)
      return () => setIsMounted(false)
    }, [])

    useEffect(() => {
      if (showTooltip && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        setTooltipPosition({
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX + rect.width / 2,
        })
      }
    }, [showTooltip])

    return (
      <div
        className="relative"
        ref={cardRef}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Card className={`overflow-hidden border-l-4 border-l-${color}-500 transition-all hover:shadow-md`}>
          <CardContent className="p-0">
            <div className="flex items-stretch">
              <div className="flex-1 p-3 overflow-hidden">
                <p className="text-sm font-medium text-muted-foreground mb-1 truncate">{title}</p>
                <div className="flex items-baseline gap-1">{value}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">{subtitle}</div>
              </div>
              <div
                className={`bg-${color}-500 text-white p-2 flex items-center justify-center min-w-[40px] flex-shrink-0`}
              >
                {icon}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tooltip usando portal */}
        {isMounted &&
          showTooltip &&
          createPortal(
            <div
              style={{
                position: "absolute",
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: "translateX(-50%)",
                zIndex: 99999,
              }}
            >
              <div
                className={`bg-${color}-50 border border-${color}-200 shadow-lg rounded-md p-4 w-64 relative dark:bg-gray-900 dark:border-gray-800 dark:text-white`}
              >
                {/* Seta apontando para cima */}
                <div
                  className={`absolute top-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 bg-${color}-50 dark:bg-${color}-900/20 border-t border-l border-${color}-200 dark:border-${color}-800/30`}
                ></div>

                <div className="flex items-start gap-3">
                  {tooltipIcon || (
                    <div
                      className={`mt-0.5 p-2 rounded-full bg-${color}-100 dark:bg-${color}-800/30 text-${color}-600 dark:text-${color}-300`}
                    >
                      {icon}
                    </div>
                  )}

                  <div className="space-y-2 flex-1">
                    <p className={`font-semibold text-${color}-700 dark:text-${color}-300`}>{tooltipTitle}</p>
                    {tooltipContent}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      {/* Cards para desktop - 5 colunas */}
      <div className="hidden md:grid md:grid-cols-5 gap-3 sm:gap-4">
        {/* Card de Saldo */}
        <SummaryCard
          id="saldo"
          title="Saldo do Período"
          value={
            <h3 className={`text-xl sm:text-2xl font-bold truncate ${saldo >= 0 ? "text-blue-500" : "text-red-500"}`}>
              <AnimatedCounter
                value={saldo}
                formatter={(val) => formatCurrencyWithUserSettings(val)}
                className="truncate"
              />
            </h3>
          }
          subtitle={
            <>
              <span className="truncate">Receitas - Despesas</span>
              {saldo >= 0 ? (
                <span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-1.5 py-0.5 flex-shrink-0">
                  Positivo
                </span>
              ) : (
                <span className="rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-1.5 py-0.5 flex-shrink-0">
                  Negativo
                </span>
              )}
            </>
          }
          icon={<CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="blue"
          tooltipTitle="Saldo do Período"
          tooltipIcon={
            <div className="mt-0.5 p-2 rounded-full bg-blue-100 dark:bg-blue-800/30 text-blue-600 dark:text-blue-300">
              <CreditCard className="h-5 w-5" />
            </div>
          }
          tooltipContent={
            <>
              <div className="flex justify-between items-center mt-1 mb-2">
                <p className="text-sm font-medium">Valor exato:</p>
                <p
                  className={`font-bold ${saldo >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {formatCurrencyWithUserSettings(saldo)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Diferença entre todas as receitas e despesas no período selecionado.
              </p>
            </>
          }
        />

        {/* Card de Receitas */}
        <SummaryCard
          id="receitas"
          title="Receitas"
          value={
            <h3 className="text-xl sm:text-2xl font-bold truncate text-green-500">
              <AnimatedCounter
                value={receitas}
                formatter={(val) => formatCurrencyWithUserSettings(val)}
                className="truncate"
              />
            </h3>
          }
          subtitle={
            <>
              <span className="truncate">Total de entradas</span>
              {receitas > despesas ? (
                <span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-1.5 py-0.5 flex-shrink-0">
                  +
                </span>
              ) : null}
            </>
          }
          icon={<ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="green"
          tooltipTitle="Receitas"
          tooltipIcon={
            <div className="mt-0.5 p-2 rounded-full bg-green-100 dark:bg-green-800/30 text-green-600 dark:text-green-300">
              <ArrowUpCircle className="h-5 w-5" />
            </div>
          }
          tooltipContent={
            <>
              <div className="flex justify-between items-center mt-1 mb-2">
                <p className="text-sm font-medium">Valor total:</p>
                <p className="font-bold text-green-600 dark:text-green-400">
                  {formatCurrencyWithUserSettings(receitas)}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Soma de todas as entradas financeiras no período selecionado.
              </p>
              {receitas > 0 && despesas !== 0 && (
                <div className="mt-2 p-2 bg-green-100/50 dark:bg-green-900/20 rounded-md">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    As receitas representam {Math.round((receitas / (receitas + Math.abs(despesas))) * 100)}% do volume
                    total de transações.
                  </p>
                </div>
              )}
            </>
          }
        />

        {/* Card de Despesas */}
        <SummaryCard
          id="despesas"
          title="Despesas"
          value={
            <h3 className="text-xl sm:text-2xl font-bold truncate text-red-500">
              <AnimatedCounter
                value={Math.abs(despesas)}
                formatter={(val) => formatCurrencyWithUserSettings(val)}
                className="truncate"
              />
            </h3>
          }
          subtitle={
            <>
              <span className="truncate">Total de saídas</span>
              {despesas !== 0 && (
                <span className="rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-1.5 py-0.5 flex-shrink-0">
                  {Math.round((Math.abs(despesas) / (receitas + Math.abs(despesas))) * 100)}%
                </span>
              )}
            </>
          }
          icon={<ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="red"
          tooltipTitle="Despesas"
          tooltipIcon={
            <div className="mt-0.5 p-2 rounded-full bg-red-100 dark:bg-red-800/30 text-red-600 dark:text-red-300">
              <ArrowDownCircle className="h-5 w-5" />
            </div>
          }
          tooltipContent={
            <>
              <div className="flex justify-between items-center mt-1 mb-2">
                <p className="text-sm font-medium">Valor total:</p>
                <p className="font-bold text-red-600 dark:text-red-400">
                  {formatCurrencyWithUserSettings(Math.abs(despesas))}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Soma de todas as saídas financeiras no período selecionado.
              </p>
              {despesas !== 0 && (
                <div className="mt-2 p-2 bg-red-100/50 dark:bg-red-900/20 rounded-md">
                  <p className="text-xs text-red-700 dark:text-red-300">
                    As despesas representam {Math.round((Math.abs(despesas) / (receitas + Math.abs(despesas))) * 100)}%
                    do volume total de transações.
                  </p>
                </div>
              )}
            </>
          }
        />

        {/* Card de Transações */}
        <SummaryCard
          id="transacoes"
          title="Transações"
          value={
            <h3 className="text-xl sm:text-2xl font-bold text-purple-500">
              <AnimatedCounter
                value={totalTransacoes}
                formatter={(val) => Math.round(val).toString()}
                className="truncate"
              />
            </h3>
          }
          subtitle={
            <>
              <span className="truncate">Total de registros</span>
              {totalTransacoes > 0 && (
                <span className="rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 flex-shrink-0">
                  Este mês
                </span>
              )}
            </>
          }
          icon={<DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="purple"
          tooltipTitle="Transações"
          tooltipIcon={
            <div className="mt-0.5 p-2 rounded-full bg-purple-100 dark:bg-purple-800/30 text-purple-600 dark:text-purple-300">
              <DollarSign className="h-5 w-5" />
            </div>
          }
          tooltipContent={
            <>
              <div className="flex justify-between items-center mt-1 mb-2">
                <p className="text-sm font-medium">Total de registros:</p>
                <p className="font-bold text-purple-600 dark:text-purple-400">{totalTransacoes} transações</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Número total de transações registradas no período selecionado.
              </p>
            </>
          }
        />

        {/* Card de Transações Futuras */}
        <SummaryCard
          id="futuras"
          title="Futuras"
          value={
            <h3 className="text-xl sm:text-2xl font-bold text-amber-500">
              <AnimatedCounter
                value={totalFuturas}
                formatter={(val) => Math.round(val).toString()}
                className="truncate"
              />
            </h3>
          }
          subtitle={
            <>
              <span className="truncate">Transações agendadas</span>
              {totalFuturas > 0 && (
                <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 flex-shrink-0">
                  Pendentes
                </span>
              )}
            </>
          }
          icon={<Calendar className="h-4 w-4 sm:h-5 sm:w-5" />}
          color="amber"
          tooltipTitle="Transações Futuras"
          tooltipIcon={
            <div className="mt-0.5 p-2 rounded-full bg-amber-100 dark:bg-amber-800/30 text-amber-600 dark:text-amber-300">
              <Calendar className="h-5 w-5" />
            </div>
          }
          tooltipContent={
            <>
              <div className="flex justify-between items-center mt-1 mb-2">
                <p className="text-sm font-medium">Total agendado:</p>
                <p className="font-bold text-amber-600 dark:text-amber-400">{totalFuturas} transações</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Número total de transações futuras que estão agendadas para este mês.
              </p>
            </>
          }
        />
      </div>

      {/* Cards para mobile - 2 colunas principais e 3 secundárias */}
      <div className="md:hidden space-y-3">
        {/* Linha 1: Saldo e Receitas/Despesas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card de Saldo */}
          <SummaryCard
            id="saldo-mobile"
            title="Saldo do Período"
            value={
              <h3 className={`text-xl font-bold truncate ${saldo >= 0 ? "text-blue-500" : "text-red-500"}`}>
                <AnimatedCounter
                  value={saldo}
                  formatter={(val) => formatCurrencyWithUserSettings(val)}
                  className="truncate"
                />
              </h3>
            }
            subtitle={
              <>
                <span className="truncate">Receitas - Despesas</span>
                {saldo >= 0 ? (
                  <span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-1.5 py-0.5 flex-shrink-0">
                    Positivo
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-1.5 py-0.5 flex-shrink-0">
                    Negativo
                  </span>
                )}
              </>
            }
            icon={<CreditCard className="h-4 w-4" />}
            color="blue"
            tooltipTitle="Saldo do Período"
            tooltipContent={
              <>
                <p className="text-sm text-muted-foreground">
                  Diferença entre todas as receitas e despesas no período selecionado.
                </p>
              </>
            }
          />

          {/* Card de Receitas/Despesas combinado para mobile */}
          <div
            className={`overflow-hidden border-l-4 border-l-purple-500 transition-all hover:shadow-md bg-card rounded-md`}
          >
            <div className="p-0">
              <div className="flex items-stretch">
                <div className="flex-1 p-3 overflow-hidden">
                  <p className="text-sm font-medium text-muted-foreground mb-1 truncate">Receitas/Despesas</p>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Receitas:</span>
                      <span className="text-sm font-medium text-green-500">
                        {formatCurrencyWithUserSettings(receitas)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Despesas:</span>
                      <span className="text-sm font-medium text-red-500">
                        {formatCurrencyWithUserSettings(Math.abs(despesas))}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className={`bg-purple-500 text-white p-2 flex items-center justify-center min-w-[40px] flex-shrink-0`}
                >
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Linha 2: Transações, Futuras e Outros indicadores */}
        <div className="grid grid-cols-3 gap-3">
          {/* Card de Transações */}
          <div
            className={`overflow-hidden border-l-4 border-l-purple-500 transition-all hover:shadow-md bg-card rounded-md`}
          >
            <div className="p-0">
              <div className="flex flex-col h-full">
                <div className="p-2 text-center">
                  <p className="text-xs font-medium text-muted-foreground truncate">Transações</p>
                  <div className="text-lg font-bold text-purple-500">{totalTransacoes}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Transações Futuras */}
          <div
            className={`overflow-hidden border-l-4 border-l-amber-500 transition-all hover:shadow-md bg-card rounded-md`}
          >
            <div className="p-0">
              <div className="flex flex-col h-full">
                <div className="p-2 text-center">
                  <p className="text-xs font-medium text-muted-foreground truncate">Futuras</p>
                  <div className="text-lg font-bold text-amber-500">{totalFuturas}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Percentual de Despesas */}
          <div
            className={`overflow-hidden border-l-4 border-l-red-500 transition-all hover:shadow-md bg-card rounded-md`}
          >
            <div className="p-0">
              <div className="flex flex-col h-full">
                <div className="p-2 text-center">
                  <p className="text-xs font-medium text-muted-foreground truncate">% Despesas</p>
                  <div className="text-lg font-bold text-red-500">
                    {receitas + Math.abs(despesas) > 0
                      ? Math.round((Math.abs(despesas) / (receitas + Math.abs(despesas))) * 100)
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
