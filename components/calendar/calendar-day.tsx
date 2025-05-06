"use client"

import type { Transaction } from "../finance-provider"
import { formatCurrency } from "@/utils/format-currency"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface CalendarDayProps {
  date: Date
  isCurrentMonth: boolean
  transactions: Transaction[]
  onClick: () => void
}

export function CalendarDay({ date, isCurrentMonth, transactions, onClick }: CalendarDayProps) {
  const isToday = new Date().toDateString() === date.toDateString()
  const isWeekend = date.getDay() === 0 || date.getDay() === 6

  // Calcular saldo do dia
  const receitas = transactions.filter((t) => t.type === "receita").reduce((acc, t) => acc + t.amount, 0)
  const despesas = transactions.filter((t) => t.type === "despesa").reduce((acc, t) => acc + t.amount, 0)
  const hasFutureTransactions = transactions.some((t) => t.status === "futura")

  // Determinar se o dia tem um saldo positivo, negativo ou neutro
  const saldoDia = receitas + despesas
  const temSaldo = transactions.length > 0

  // Formatar a data para exibição no tooltip
  const formattedDate = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  // Determinar a cor de fundo com base no saldo do dia
  const getBgColor = () => {
    if (!temSaldo) return ""
    if (saldoDia > 0) return "bg-green-50/50 dark:bg-green-900/10"
    if (saldoDia < 0) return "bg-red-50/50 dark:bg-red-900/10"
    return ""
  }

  const totalIncome = transactions.filter((t) => t.type === "receita").reduce((acc, t) => acc + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === "despesa").reduce((acc, t) => acc + t.amount, 0)
  const futureCount = transactions.filter((t) => t.status === "futura").length
  const hasIncome = totalIncome > 0
  const hasExpense = totalExpense < 0
  const hasFuture = futureCount > 0

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={onClick}
            className={`
    relative flex flex-col items-center justify-start p-1 sm:p-2 
    rounded-md cursor-pointer transition-colors
    min-h-[40px] sm:min-h-[60px] text-center
    ${isCurrentMonth ? "bg-card hover:bg-muted/50" : "bg-muted/20 text-muted-foreground hover:bg-muted/30"}
    ${isToday ? "ring-2 ring-primary/30" : ""}
  `}
          >
            <span className={`text-xs sm:text-sm font-medium ${isCurrentMonth ? "" : "text-muted-foreground/70"}`}>
              {date.getDate()}
            </span>

            {/* Indicadores de transação */}
            <div className="flex flex-wrap justify-center gap-1 mt-1">
              {hasIncome && (
                <div
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500"
                  title={`Receitas: ${formatCurrency(totalIncome)}`}
                ></div>
              )}
              {hasExpense && (
                <div
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"
                  title={`Despesas: ${formatCurrency(Math.abs(totalExpense))}`}
                ></div>
              )}
              {hasFuture && (
                <div
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500"
                  title={`Transações futuras: ${futureCount}`}
                ></div>
              )}
            </div>

            {/* Valor total do dia - visível apenas em telas maiores */}
            {(hasIncome || hasExpense) && (
              <div className="hidden sm:block mt-1 text-xs font-medium">
                <span
                  className={`${
                    totalIncome + totalExpense >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(totalIncome + totalExpense)}
                </span>
              </div>
            )}

            {/* Indicador de quantidade de transações */}
            {transactions.length > 0 && (
              <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1">
                <span className="flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 text-[8px] sm:text-[10px] font-bold bg-primary/10 text-primary rounded-full">
                  {transactions.length}
                </span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <div className="font-medium">{formattedDate}</div>
          {transactions.length > 0 ? (
            <div className="text-sm mt-1">
              <div>{transactions.length} transação(ões)</div>
              {receitas > 0 && <div className="text-green-500">Receitas: {formatCurrency(receitas)}</div>}
              {despesas < 0 && <div className="text-red-500">Despesas: {formatCurrency(despesas)}</div>}
              <div className={saldoDia >= 0 ? "text-green-500" : "text-red-500"}>Saldo: {formatCurrency(saldoDia)}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground mt-1">Nenhuma transação</div>
          )}
          <div className="text-xs text-muted-foreground mt-1">Clique para gerenciar transações</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
