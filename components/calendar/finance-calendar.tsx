"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Info, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { useFinance, type Transaction } from "../finance-provider"
import { CalendarDay } from "./calendar-day"
import { CalendarTransactionDialog } from "./calendar-transaction-dialog"
import { formatCurrency } from "@/utils/format-currency"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface FinanceCalendarProps {
  month: number
  year: number
}

export function FinanceCalendar({ month, year }: FinanceCalendarProps) {
  const [mounted, setMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<Array<{ date: Date; isCurrentMonth: boolean }>>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [transactionsByDate, setTransactionsByDate] = useState<Record<string, Transaction[]>>({})

  const { transactions } = useFinance()

  // Efeito para marcar quando o componente está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Atualizar a data atual quando month ou year mudar
  useEffect(() => {
    if (mounted) {
      setCurrentDate(new Date(year, month, 1))
    }
  }, [month, year, mounted])

  // Gerar dias do calendário
  useEffect(() => {
    if (!mounted) return

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Primeiro dia do mês
    const firstDayOfMonth = new Date(year, month, 1)
    // Último dia do mês
    const lastDayOfMonth = new Date(year, month + 1, 0)

    // Dia da semana do primeiro dia (0 = Domingo, 1 = Segunda, etc.)
    const firstDayOfWeek = firstDayOfMonth.getDay()

    // Dias do mês anterior para preencher o início do calendário
    const daysFromPrevMonth = firstDayOfWeek
    // Dias do mês atual
    const daysInMonth = lastDayOfMonth.getDate()
    // Dias do próximo mês para preencher o final do calendário
    const daysFromNextMonth = 42 - daysInMonth - daysFromPrevMonth // 42 = 6 semanas * 7 dias

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = []

    // Adicionar dias do mês anterior
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month, -i)
      days.push({ date, isCurrentMonth: false })
    }

    // Adicionar dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      days.push({ date, isCurrentMonth: true })
    }

    // Adicionar dias do próximo mês
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(year, month + 1, i)
      days.push({ date, isCurrentMonth: false })
    }

    setCalendarDays(days)
  }, [currentDate, mounted])

  // Agrupar transações por data
  useEffect(() => {
    if (!mounted) return

    const groupedTransactions: Record<string, Transaction[]> = {}

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date)
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

      if (!groupedTransactions[dateKey]) {
        groupedTransactions[dateKey] = []
      }

      groupedTransactions[dateKey].push(transaction)
    })

    setTransactionsByDate(groupedTransactions)
  }, [transactions, mounted])

  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setIsDialogOpen(true)
  }

  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  // Calcular saldo do mês
  const getMonthBalance = () => {
    if (!mounted) return { receitas: 0, despesas: 0, saldo: 0 }

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    let receitas = 0
    let despesas = 0

    Object.values(transactionsByDate)
      .flat()
      .forEach((transaction) => {
        const date = new Date(transaction.date)
        if (date.getFullYear() === year && date.getMonth() === month) {
          if (transaction.type === "receita") {
            receitas += transaction.amount
          } else {
            despesas += transaction.amount // despesas já são negativas
          }
        }
      })

    return {
      receitas,
      despesas,
      saldo: receitas + despesas,
    }
  }

  const monthBalance = getMonthBalance()

  // Calcular estatísticas do mês
  const getMonthStats = () => {
    if (!mounted) return { totalTransactions: 0, daysWithTransactions: 0, categorias: [] }

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    let totalTransactions = 0
    const daysSet = new Set()
    const categoriasSet = new Set()

    Object.values(transactionsByDate)
      .flat()
      .forEach((transaction) => {
        const date = new Date(transaction.date)
        if (date.getFullYear() === year && date.getMonth() === month) {
          totalTransactions++
          const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
          daysSet.add(dayKey)
          categoriasSet.add(transaction.category)
        }
      })

    return {
      totalTransactions,
      daysWithTransactions: daysSet.size,
      categorias: Array.from(categoriasSet),
    }
  }

  const monthStats = getMonthStats()

  return (
    <TooltipProvider>
      <Card className="w-full dashboard-card">
        <CardHeader className="flex flex-row items-center justify-between border-b py-3 px-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                <span>Receitas</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                <span>Despesas</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-amber-500 mr-1"></div>
                <span>Futuras</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {monthStats.totalTransactions} transações
            </Badge>
            <Badge variant="outline" className="text-xs">
              {monthStats.daysWithTransactions} dias com movimentação
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
            <div className="flex items-center p-2 rounded-md border bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10">
              <ArrowDownRight className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
              <div>
                <div className="text-xs text-muted-foreground">Receitas</div>
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(monthBalance.receitas)}
                </div>
              </div>
            </div>

            <div className="flex items-center p-2 rounded-md border bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10">
              <ArrowUpRight className="h-4 w-4 text-red-600 dark:text-red-400 mr-2" />
              <div>
                <div className="text-xs text-muted-foreground">Despesas</div>
                <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(Math.abs(monthBalance.despesas))}
                </div>
              </div>
            </div>

            <div className="flex items-center p-2 rounded-md border bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mr-2" />
              <div>
                <div className="text-xs text-muted-foreground">Saldo</div>
                <div
                  className={`text-sm font-semibold ${
                    monthBalance.saldo >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(monthBalance.saldo)}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 w-full">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium py-1 text-muted-foreground">
                {/* Mostrar apenas a primeira letra em telas muito pequenas */}
                <span className="hidden xs:inline">{day}</span>
                <span className="xs:hidden">{day.charAt(0)}</span>
              </div>
            ))}

            {calendarDays.map((day, index) => {
              const dateKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`
              const dayTransactions = transactionsByDate[dateKey] || []

              return (
                <CalendarDay
                  key={index}
                  date={day.date}
                  isCurrentMonth={day.isCurrentMonth}
                  transactions={dayTransactions}
                  onClick={() => handleDayClick(day.date)}
                />
              )
            })}
          </div>
        </CardContent>

        {selectedDate && (
          <CalendarTransactionDialog date={selectedDate} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
        )}
      </Card>
    </TooltipProvider>
  )
}
