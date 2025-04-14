"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useFinance, type Transaction, type TransactionStatus } from "../finance-provider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TransactionDialogProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TransactionDialog({ transaction, open, onOpenChange }: TransactionDialogProps) {
  // Estado para controlar se estamos no cliente
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState<Partial<Transaction>>({})
  const [uniqueCategories, setUniqueCategories] = useState<string[]>([])

  // Agora que estamos no cliente, podemos usar o hook useFinance com segurança
  const { updateTransaction, transactions } = useFinance()

  // Efeito para marcar quando o componente está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Extrair categorias únicas das transações existentes
  useEffect(() => {
    if (mounted) {
      const categories = [...new Set(transactions.map((t) => t.category))]
      setUniqueCategories(categories)
    }
  }, [transactions, mounted])

  // Atualizar formData quando a transação mudar
  useEffect(() => {
    if (transaction && mounted) {
      setFormData({
        ...transaction,
        amount: Math.abs(transaction.amount),
      })
    }
  }, [transaction, mounted])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (transaction && formData) {
      const updatedTransaction: Transaction = {
        ...transaction,
        ...formData,
        amount: formData.type === "despesa" ? -Math.abs(formData.amount || 0) : Math.abs(formData.amount || 0),
        status: (formData.status as TransactionStatus) || "realizada",
      }
      updateTransaction(updatedTransaction)
      onOpenChange(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number.parseFloat(value) : value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Se não houver transação selecionada ou não estiver montado, não renderizar o conteúdo do diálogo
  if (!transaction || !mounted) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="h-[300px] animate-pulse bg-muted rounded-md"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount || ""}
                  onChange={handleChange}
                  required
                  aria-describedby="amount-desc"
                />
                <span id="amount-desc" className="sr-only">
                  Valor da transação
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  name="type"
                  value={formData.type || ""}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                required
                aria-describedby="description-desc"
              />
              <span id="description-desc" className="sr-only">
                Descrição da transação
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category || ""}
                  onChange={handleChange}
                  list="categories"
                  required
                  aria-describedby="category-desc"
                />
                <datalist id="categories">
                  {uniqueCategories.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
                <span id="category-desc" className="sr-only">
                  Categoria da transação
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategoria</Label>
                <Input
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory || ""}
                  onChange={handleChange}
                  aria-describedby="subcategory-desc"
                />
                <span id="subcategory-desc" className="sr-only">
                  Subcategoria da transação (opcional)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date ? new Date(formData.date).toISOString().split("T")[0] : ""}
                  onChange={handleChange}
                  required
                  aria-describedby="date-desc"
                />
                <span id="date-desc" className="sr-only">
                  Data da transação
                </span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  value={formData.status || "realizada"}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realizada">Realizada</SelectItem>
                    <SelectItem value="futura">Futura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Salvar alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
