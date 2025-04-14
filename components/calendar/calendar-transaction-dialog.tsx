"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFinance, type Transaction, type TransactionType } from "../finance-provider"
import { formatCurrency } from "@/utils/format-currency"
import { Trash2, Calendar, DollarSign, Tag, FileText, Layers } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CalendarTransactionDialogProps {
  date: Date
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CalendarTransactionDialog({ date, open, onOpenChange }: CalendarTransactionDialogProps) {
  const [mounted, setMounted] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [formData, setFormData] = useState<{
    description: string
    amount: string
    type: TransactionType
    category: string
    subcategory: string
  }>({
    description: "",
    amount: "",
    type: "receita",
    category: "",
    subcategory: "",
  })
  const [activeTab, setActiveTab] = useState<string>("existing")

  const { getTransactionsByDate, addTransaction, deleteTransaction } = useFinance()

  // Efeito para marcar quando o componente está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Carregar transações da data selecionada
  useEffect(() => {
    if (mounted && date) {
      const dateTransactions = getTransactionsByDate(date)
      setTransactions(dateTransactions)

      // Se não houver transações, ativar a aba de adicionar
      if (dateTransactions.length === 0) {
        setActiveTab("add")
      } else {
        setActiveTab("existing")
      }
    }
  }, [mounted, date, getTransactionsByDate, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const amount = Number.parseFloat(formData.amount.replace(",", "."))
    if (isNaN(amount) || amount <= 0) return

    // Verificar se a data é futura
    const isFuture = date > new Date()

    addTransaction({
      description: formData.description,
      amount: formData.type === "despesa" ? -Math.abs(amount) : amount,
      type: formData.type,
      category: formData.category,
      subcategory: formData.subcategory,
      date: new Date(date),
      status: isFuture ? "futura" : "realizada",
    })

    // Limpar formulário
    setFormData({
      description: "",
      amount: "",
      type: "receita",
      category: "",
      subcategory: "",
    })

    // Atualizar lista de transações
    const updatedTransactions = getTransactionsByDate(date)
    setTransactions(updatedTransactions)

    // Mudar para a aba de transações existentes
    setActiveTab("existing")
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      deleteTransaction(id)

      // Atualizar lista de transações
      const updatedTransactions = getTransactionsByDate(date)
      setTransactions(updatedTransactions)

      // Se não houver mais transações, mudar para a aba de adicionar
      if (updatedTransactions.length === 0) {
        setActiveTab("add")
      }
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  if (!mounted) return null

  // Calcular totais para a data selecionada
  const receitas = transactions.filter((t) => t.type === "receita").reduce((acc, t) => acc + t.amount, 0)
  const despesas = transactions.filter((t) => t.type === "despesa").reduce((acc, t) => acc + t.amount, 0)
  const saldo = receitas + despesas

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <DialogTitle>Transações de {formatDate(date)}</DialogTitle>
            </div>

            {transactions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 text-xs">
                <div className="px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                  Receitas: {formatCurrency(receitas)}
                </div>
                <div className="px-2 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                  Despesas: {formatCurrency(despesas)}
                </div>
                <div
                  className={`px-2 py-1 rounded-md ${
                    saldo >= 0
                      ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                      : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                  }`}
                >
                  Saldo: {formatCurrency(saldo)}
                </div>
              </div>
            )}
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="existing" disabled={transactions.length === 0}>
                <FileText className="h-4 w-4 mr-1.5" />
                Transações ({transactions.length})
              </TabsTrigger>
              <TabsTrigger value="add">
                <DollarSign className="h-4 w-4 mr-1.5" />
                Adicionar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4">
              {transactions.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`flex items-center justify-between p-2 border rounded-md
                        ${
                          transaction.type === "receita"
                            ? "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20"
                            : "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20"
                        }
                        ${transaction.status === "futura" ? "opacity-80 border-dashed" : ""}
                      `}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {transaction.category} {transaction.subcategory ? `/ ${transaction.subcategory}` : ""}
                          {transaction.status === "futura" ? " (Futura)" : ""}
                        </p>
                      </div>
                      <div
                        className={`text-sm font-medium ${
                          transaction.amount >= 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        } mx-2 whitespace-nowrap`}
                      >
                        {formatCurrency(transaction.amount)}
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(transaction.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Excluir transação</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
                  Nenhuma transação registrada nesta data.
                </p>
              )}
            </TabsContent>

            <TabsContent value="add">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="flex items-center text-xs">
                      <Tag className="h-3.5 w-3.5 mr-1" />
                      Tipo
                    </Label>
                    <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="flex items-center text-xs">
                      <DollarSign className="h-3.5 w-3.5 mr-1" />
                      Valor
                    </Label>
                    <Input
                      id="amount"
                      name="amount"
                      value={formData.amount}
                      onChange={handleChange}
                      placeholder="0,00"
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center text-xs">
                    <FileText className="h-3.5 w-3.5 mr-1" />
                    Descrição
                  </Label>
                  <Input
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descrição da transação"
                    className="h-8 text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center text-xs">
                      <Layers className="h-3.5 w-3.5 mr-1" />
                      Categoria
                    </Label>
                    <Input
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="Categoria"
                      className="h-8 text-xs"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subcategory" className="flex items-center text-xs">
                      <Layers className="h-3.5 w-3.5 mr-1" />
                      Subcategoria
                    </Label>
                    <Input
                      id="subcategory"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      placeholder="Subcategoria (opcional)"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <DialogFooter className="mt-4 pt-2 border-t">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="submit" size="sm">
                        Adicionar Transação
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Adicionar nova transação para {formatDate(date)}</p>
                    </TooltipContent>
                  </Tooltip>
                </DialogFooter>
              </form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
