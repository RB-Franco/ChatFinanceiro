"use client"

import { useEffect, useState, useCallback } from "react"
import { useFinance, type Transaction } from "../finance-provider"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ArrowDown01,
  ArrowDownAZ,
  ArrowUp01,
  ArrowUpAZ,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  Search,
  Tag,
  Trash2,
  Users,
} from "lucide-react"
import { TransactionDialog } from "../transactions/transaction-dialog"
import { formatCurrency } from "@/utils/format-currency"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RecentTransactionsProps {
  month: number
  year: number
  includeFuture?: boolean
}

type SortField = "date" | "category" | "description" | "amount"
type SortDirection = "asc" | "desc"

export function RecentTransactions({ month, year, includeFuture = false }: RecentTransactionsProps) {
  // Estado para controlar se estamos no cliente
  const [mounted, setMounted] = useState(false)
  const { getTransactionsByMonth, deleteTransaction } = useFinance()

  // Estados para controlar a edição de transações
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Estados para paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Estados para ordenação
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  // Estado para filtro
  const [filterText, setFilterText] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  // Obter transações filtradas pelo mês e ano
  const getFilteredTransactions = useCallback(() => {
    return mounted ? getTransactionsByMonth(month, year) : []
  }, [getTransactionsByMonth, month, year, mounted])

  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    setFilteredTransactions(getFilteredTransactions())
  }, [getFilteredTransactions])

  // Efeito para marcar quando o componente está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Se o componente ainda não está montado, não renderizar nada
  // Early return if not mounted
  // if (!mounted) {
  //   return (
  //     <Card className="w-full h-full flex flex-col overflow-hidden dashboard-card">
  //       <CardHeader className="pb-3 space-y-2">
  //         <CardTitle>Transações Recentes</CardTitle>
  //       </CardHeader>
  //       <CardContent className="flex-1 overflow-hidden p-0">
  //         <div className="p-6 space-y-4">
  //           {[...Array(3)].map((_, i) => (
  //             <div key={i} className="h-16 animate-pulse bg-muted rounded-md"></div>
  //           ))}
  //         </div>
  //       </CardContent>
  //     </Card>
  //   )
  // }

  // Filtrar por status se necessário
  const statusFilteredTransactions = includeFuture
    ? filteredTransactions
    : filteredTransactions.filter((t) => t.status === "realizada")

  // Aplicar filtro de texto
  const textFilteredTransactions = filterText
    ? statusFilteredTransactions.filter(
        (t) =>
          t.description.toLowerCase().includes(filterText.toLowerCase()) ||
          t.category.toLowerCase().includes(filterText.toLowerCase()) ||
          (t.subcategory && t.subcategory.toLowerCase().includes(filterText.toLowerCase())),
      )
    : statusFilteredTransactions

  // Aplicar ordenação
  const sortedTransactions = [...textFilteredTransactions].sort((a, b) => {
    if (sortField === "date") {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA
    } else if (sortField === "category") {
      const categoryA = a.category.toLowerCase()
      const categoryB = b.category.toLowerCase()
      return sortDirection === "asc" ? categoryA.localeCompare(categoryB) : categoryB.localeCompare(categoryA)
    } else if (sortField === "description") {
      const descA = a.description.toLowerCase()
      const descB = b.description.toLowerCase()
      return sortDirection === "asc" ? descA.localeCompare(descB) : descB.localeCompare(descA)
    } else if (sortField === "amount") {
      return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount
    }
    return 0
  })

  // Calcular paginação
  const totalItems = sortedTransactions.length
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))

  // Ajustar página atual se necessário
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  // Obter transações da página atual
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const currentTransactions = sortedTransactions.slice(startIndex, endIndex)

  // Função para abrir o diálogo de edição
  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      deleteTransaction(id)
    }
  }

  // Função para alternar ordenação
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Função para navegar entre páginas
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  // Função para gerar uma cor baseada na categoria
  const getCategoryColor = (category: string): string => {
    // Gerar uma cor baseada no hash da string da categoria
    let hash = 0
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash)
    }
    const h = Math.abs(hash) % 360
    return `hsl(${h}, 70%, 60%)`
  }

  // Renderizar ícone de ordenação
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null

    if (field === "date" || field === "amount") {
      return sortDirection === "asc" ? (
        <ArrowUp01 className="h-3.5 w-3.5 ml-1" />
      ) : (
        <ArrowDown01 className="h-3.5 w-3.5 ml-1" />
      )
    } else {
      return sortDirection === "asc" ? (
        <ArrowUpAZ className="h-3.5 w-3.5 ml-1" />
      ) : (
        <ArrowDownAZ className="h-3.5 w-3.5 ml-1" />
      )
    }
  }

  return (
    <>
      <Card className="w-full h-full flex flex-col overflow-hidden dashboard-card">
        <CardHeader className="pb-3 space-y-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <span>Transações Recentes</span>
              {mounted && sortedTransactions.length > 0 && (
                <Badge variant="outline" className="ml-2 text-xs font-normal">
                  {totalItems} transações
                </Badge>
              )}
            </CardTitle>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
              <span className="sr-only">Mostrar filtros</span>
            </Button>
          </div>

          {mounted && showFilters && (
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar transações..."
                  className="pl-9"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                />
              </div>
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => setItemsPerPage(Number.parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Itens por página" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 por página</SelectItem>
                  <SelectItem value="10">10 por página</SelectItem>
                  <SelectItem value="15">15 por página</SelectItem>
                  <SelectItem value="20">20 por página</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0">
          {!mounted ? (
            <div className="p-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-muted rounded-md"></div>
              ))}
            </div>
          ) : sortedTransactions.length > 0 ? (
            <div className="overflow-y-auto max-h-[350px] dashboard-transition">
              <div className="px-6 py-2 border-b bg-muted/30 sticky top-0 z-10">
                <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground">
                  <button
                    className="col-span-2 flex items-center cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("date")}
                  >
                    Data
                    {renderSortIcon("date")}
                  </button>
                  <button
                    className="col-span-3 flex items-center cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("category")}
                  >
                    Categoria
                    {renderSortIcon("category")}
                  </button>
                  <button
                    className="col-span-4 flex items-center cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("description")}
                  >
                    Descrição
                    {renderSortIcon("description")}
                  </button>
                  <button
                    className="col-span-2 text-right flex items-center justify-end cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => toggleSort("amount")}
                  >
                    Valor
                    {renderSortIcon("amount")}
                  </button>
                  <div className="col-span-1 text-right"></div>
                </div>
              </div>

              <div className="divide-y">
                {currentTransactions.map((transaction) => (
                  <div key={transaction.id} className="px-6 py-3 hover:bg-muted/30 transition-colors group">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-2 flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{formatDate(transaction.date)}</span>
                      </div>

                      <div className="col-span-3 flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(transaction.category) }}
                        />
                        <div className="truncate">
                          <span className="text-sm capitalize">{transaction.category}</span>
                          {transaction.subcategory && (
                            <span className="text-xs text-muted-foreground ml-1">/ {transaction.subcategory}</span>
                          )}
                        </div>
                      </div>

                      <div className="col-span-4 flex items-center">
                        <span className="text-sm truncate">{transaction.description}</span>
                        {transaction.status === "futura" && (
                          <Badge
                            variant="outline"
                            className="ml-2 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          >
                            Futura
                          </Badge>
                        )}
                        {transaction.family_code && (
                          <div className="flex items-center" title="Transação familiar">
                            <Users className="h-3 w-3 text-primary ml-1" />
                          </div>
                        )}
                      </div>

                      <div
                        className={`col-span-2 text-sm font-medium text-right ${
                          transaction.amount >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {formatCurrency(transaction.amount)}
                      </div>

                      <div className="col-span-1 flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground p-6">
              <Tag className="h-10 w-10 mb-2 text-muted-foreground/50" />
              <p>Nenhuma transação encontrada para este período.</p>
              <p className="text-sm mt-1">Adicione transações para visualizá-las aqui.</p>
            </div>
          )}
        </CardContent>

        {mounted && sortedTransactions.length > 0 && (
          <CardFooter className="border-t p-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1}-{endIndex} de {totalItems} transações
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Lógica para mostrar páginas ao redor da página atual
                  let pageToShow
                  if (totalPages <= 5) {
                    pageToShow = i + 1
                  } else if (currentPage <= 3) {
                    pageToShow = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageToShow = totalPages - 4 + i
                  } else {
                    pageToShow = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={i}
                      variant={currentPage === pageToShow ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => goToPage(pageToShow)}
                    >
                      {pageToShow}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Diálogo de edição de transação */}
      <TransactionDialog transaction={editingTransaction} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}

// Função para formatar a data
function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR")
}
