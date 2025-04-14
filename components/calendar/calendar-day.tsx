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

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            onClick={onClick}
            className={`
              min-h-[80px] p-1 border rounded-md flex flex-col cursor-pointer transition-all
              ${isCurrentMonth ? "bg-card" : "bg-muted/30 text-muted-foreground"}
              ${isToday ? "ring-1 ring-primary" : ""}
              ${isWeekend && isCurrentMonth ? "bg-muted/10" : ""}
              ${getBgColor()}
              hover:shadow-sm hover:border-primary/30 active:scale-[0.98] transition-all
            `}
            aria-label={`${formattedDate}${temSaldo ? `, ${transactions.length} transações` : ", nenhuma transação"}`}
            role="button"
            tabIndex={0}
          >
            <div
              className={`
              text-right text-xs font-medium p-0.5 rounded-full w-5 h-5 flex items-center justify-center ml-auto
              ${isToday ? "bg-primary text-primary-foreground" : ""}
            `}
            >
              {date.getDate()}
            </div>

            <div className="flex-1 flex flex-col gap-0.5 overflow-hidden mt-0.5">
              {receitas > 0 && (
                <div className="text-[10px] px-1 py-0.5 rounded-sm bg-green-100/70 dark:bg-green-900/30 text-green-800 dark:text-green-300 truncate flex items-center">
                  <div className="w-1 h-1 rounded-full bg-green-500 mr-1" aria-hidden="true"></div>
                  <span>+{formatCurrency(receitas)}</span>
                </div>
              )}

              {despesas < 0 && (
                <div className="text-[10px] px-1 py-0.5 rounded-sm bg-red-100/70 dark:bg-red-900/30 text-red-800 dark:text-red-300 truncate flex items-center">
                  <div className="w-1 h-1 rounded-full bg-red-500 mr-1" aria-hidden="true"></div>
                  <span>{formatCurrency(despesas)}</span>
                </div>
              )}

              {hasFutureTransactions && (
                <div className="text-[10px] px-1 py-0.5 rounded-sm bg-amber-100/70 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 truncate flex items-center">
                  <div className="w-1 h-1 rounded-full bg-amber-500 mr-1" aria-hidden="true"></div>
                  <span>Futuras</span>
                </div>
              )}

              {temSaldo && transactions.length > 1 && (
                <div className="text-[10px] mt-auto text-right text-muted-foreground">{transactions.length}</div>
              )}
            </div>
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
