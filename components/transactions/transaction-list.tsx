"use client"

import { useState, useEffect, useMemo } from "react"
import { useFinance, type Transaction } from "../finance-provider"
import { DateFilter } from "../date-filter"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Users } from "lucide-react"
import { TransactionDialog } from "./transaction-dialog"
import { formatCurrencyWithUserSettings } from "@/utils/format-currency"

export function TransactionList() {
  // Estado para controlar se estamos no cliente
  const [mounted, setMounted] = useState(false)
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Efeito para marcar quando o componente está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFilterChange = (newMonth: number, newYear: number) => {
    setMonth(newMonth)
    setYear(newYear)
  }

  // Agora que estamos no cliente, podemos usar o hook useFinance com segurança
  const { transactions, deleteTransaction } = useFinance()

  // Usar useMemo para evitar recalcular as transações filtradas em cada renderização
  const filteredTransactions = useMemo(() => {
    if (!mounted) return []

    return transactions.filter((transaction) => {
      const date = new Date(transaction.date)
      return date.getMonth() === month && date.getFullYear() === year
    })
  }, [transactions, month, year, mounted])

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      deleteTransaction(id)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR")
  }

  return (
    <>
      <Card className="w-full h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle>Transações</CardTitle>
          <DateFilter onFilterChange={handleFilterChange} />
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          {mounted ? (
            filteredTransactions.length > 0 ? (
              <div className="w-full overflow-hidden flex-1">
                {/* Visualização de tabela para desktop */}
                <div className="hidden sm:block overflow-x-auto w-full h-full">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium text-sm">Data</th>
                        <th className="text-left py-2 font-medium text-sm">Descrição</th>
                        <th className="text-left py-2 font-medium text-sm">Categoria</th>
                        <th className="text-right py-2 font-medium text-sm">Valor</th>
                        <th className="text-right py-2 font-medium text-sm">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b last:border-0">
                          <td className="py-2 text-sm">{formatDate(transaction.date)}</td>
                          <td className="py-2 text-sm truncate max-w-[200px]">
                            <div className="flex items-center">
                              {transaction.description}
                              {transaction.family_code && (
                                <div className="flex items-center" title="Transação familiar">
                                  <Users className="h-3 w-3 text-primary ml-1" />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-2 text-sm capitalize truncate max-w-[150px]">
                            {transaction.category}
                            {transaction.subcategory && ` / ${transaction.subcategory}`}
                          </td>
                          <td
                            className={`py-2 text-sm text-right whitespace-nowrap ${
                              transaction.amount >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {formatCurrencyWithUserSettings(transaction.amount)}
                          </td>
                          <td className="py-2 text-sm text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(transaction)}
                                aria-label={`Editar transação: ${transaction.description}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(transaction.id)}
                                aria-label={`Excluir transação: ${transaction.description}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Visualização de cards para mobile */}
                <div className="sm:hidden w-full mobile-scroll overflow-y-auto max-h-[calc(100vh-220px)]">
                  {filteredTransactions.map((transaction) => (
                    <div key={transaction.id} className="mobile-card-layout bg-card">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-sm line-clamp-1">{transaction.description}</span>
                            {transaction.family_code && (
                              <Users className="h-3 w-3 text-primary" title="Transação familiar" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{formatDate(transaction.date)}</span>
                        </div>
                        <div className={`font-medium ${transaction.amount >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {formatCurrencyWithUserSettings(transaction.amount)}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs capitalize bg-muted px-2 py-1 rounded-full">
                          {transaction.category}
                          {transaction.subcategory && ` / ${transaction.subcategory}`}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 mobile-touch-target"
                            onClick={() => handleEdit(transaction)}
                            aria-label={`Editar transação: ${transaction.description}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 mobile-touch-target"
                            onClick={() => handleDelete(transaction.id)}
                            aria-label={`Excluir transação: ${transaction.description}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground flex-1 flex items-center justify-center">
                Nenhuma transação encontrada para este período.
              </div>
            )
          ) : (
            <div className="w-full overflow-x-auto flex-1">
              <table className="w-full min-w-[600px] hidden sm:table">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-sm">Data</th>
                    <th className="text-left py-2 font-medium text-sm">Descrição</th>
                    <th className="text-left py-2 font-medium text-sm">Categoria</th>
                    <th className="text-right py-2 font-medium text-sm">Valor</th>
                    <th className="text-right py-2 font-medium text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(3)].map((_, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td colSpan={5} className="py-4">
                        <div className="animate-pulse bg-muted h-8 rounded-md"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Skeleton para mobile */}
              <div className="sm:hidden space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="mobile-card-layout">
                    <div className="animate-pulse bg-muted h-16 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <TransactionDialog transaction={editingTransaction} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}
