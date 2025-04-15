"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from "react"
import { getSupabase, isRLSError } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useProfile } from "@/components/profile/profile-provider"

export type TransactionType = "receita" | "despesa"
export type TransactionStatus = "realizada" | "futura"

export interface Transaction {
  id: string
  description: string
  amount: number
  date: Date
  category: string
  subcategory?: string
  type: TransactionType
  status: TransactionStatus
  family_code?: string
  user_id?: string
}

export type Category = string

interface FinanceContextType {
  transactions: Transaction[]
  loading: boolean
  addTransaction: (transaction: Omit<Transaction, "id">) => Promise<void>
  updateTransaction: (transaction: Transaction) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  getTransactionsByMonth: (month: number, year: number) => Transaction[]
  getTransactionsByDate: (date: Date) => Transaction[]
  getTransactionsByCategory: (category: string) => Transaction[]
  getTransactionsByStatus: (status: TransactionStatus) => Transaction[]
  getTotalByType: (type: TransactionType, includesFuture?: boolean) => number
  getBalance: (includesFuture?: boolean) => number
  getDailyTransactions: (month: number, year: number) => { date: string; receitas: number; despesas: number }[]
  getMonthlyTransactions: (year: number) => { month: string; receitas: number; despesas: number }[]
  getYearlyTransactions: () => { year: number; receitas: number; despesas: number }[]
  formatCurrencyWithUserSettings: (value: number) => string
  isProcessingTransaction: boolean
  showFamilyTransactions: boolean
  toggleFamilyTransactions: () => void
  hasFamilyCode: boolean
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined)

// Chave para armazenar transações no localStorage
const STORAGE_KEY = "finance-transactions"

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [useLocalStorage, setUseLocalStorage] = useState(false)
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false)
  const [showFamilyTransactions, setShowFamilyTransactions] = useState(false)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [profileInitialized, setProfileInitialized] = useState(false)
  const initialLoadRef = useRef(false)
  const { toast } = useToast()
  const supabase = getSupabase()
  const profileContext = useProfile()
  const profile = profileContext?.profile

  // Efeito para definir o valor inicial de showFamilyTransactions com base no perfil
  useEffect(() => {
    if (profile) {
      // Se o usuário tem um código familiar (gerado ou associado), ativar o toggle por padrão
      const hasFamilyCode = !!(profile.familyCode || profile.associatedFamilyCode)
      setShowFamilyTransactions(hasFamilyCode)
      setProfileInitialized(true)
    }
  }, [profile])

  // Adicione esta nova função que aceita o valor de showFamilyTransactions como parâmetro
  const fetchTransactionsWithValue = useCallback(
    async (familyTransactionsValue: boolean, forceReload = false) => {
      // Se já completou o carregamento inicial e não é um forceReload, não carregar novamente
      if (initialLoadComplete && !forceReload) {
        return
      }

      try {
        setLoading(true)

        // Tentar carregar do Supabase primeiro
        try {
          // Obter o usuário autenticado
          const {
            data: { user },
          } = await supabase.auth.getUser()

          if (!user) {
            throw new Error("Usuário não autenticado")
          }

          let query = supabase.from("transactions").select("*").order("date", { ascending: false })

          const familyCode = profile?.familyCode || profile?.associatedFamilyCode

          if (familyTransactionsValue) {
            // Quando o toggle está LIGADO, mostrar APENAS transações COM código familiar
            if (familyCode) {
              query = query.eq("family_code", familyCode)
            } else {
              setTransactions([])
              setLoading(false)
              setInitialLoadComplete(true)
              return
            }
          } else {
            // Quando o toggle está DESLIGADO, mostrar APENAS transações do usuário atual SEM código familiar
            query = query.eq("user_id", user.id).is("family_code", null)
          }

          const { data, error } = await query

          if (error) {
            // Se for um erro de RLS, usar localStorage
            if (isRLSError(error)) {
              setUseLocalStorage(true)
              throw new Error("Erro de permissão no banco de dados")
            }
            throw error
          }

          // Converter strings de data para objetos Date
          const transactionsWithDates = (data || []).map((t: any) => ({
            ...t,
            date: new Date(t.date),
          }))

          setTransactions(transactionsWithDates)
          setUseLocalStorage(false)
        } catch (error) {
          setUseLocalStorage(true)

          // Carregar do localStorage como fallback
          const savedTransactions = localStorage.getItem(STORAGE_KEY)
          if (savedTransactions) {
            try {
              const parsed = JSON.parse(savedTransactions)
              // Converter strings de data para objetos Date
              const withDates = parsed.map((t: any) => ({
                ...t,
                date: new Date(t.date),
                status: t.status || "realizada", // Adicionar status padrão para transações antigas
              }))

              // Filtrar transações locais com base no toggle
              if (familyTransactionsValue) {
                // Mostrar apenas transações com family_code
                const familyTransactions = withDates.filter((t: any) => t.family_code)
                setTransactions(familyTransactions)
              } else {
                // Mostrar apenas transações sem family_code
                const personalTransactions = withDates.filter((t: any) => !t.family_code)
                setTransactions(personalTransactions)
              }
            } catch (e) {
              setTransactions([])
            }
          } else {
            setTransactions([])
          }
        }
      } catch (error) {
        setTransactions([])
      } finally {
        setLoading(false)
        setInitialLoadComplete(true)
      }
    },
    [supabase, profile],
  )

  // Modifique a função fetchTransactions para usar fetchTransactionsWithValue
  const fetchTransactions = useCallback(
    async (forceReload = false) => {
      // Usar o valor atual de showFamilyTransactions
      await fetchTransactionsWithValue(showFamilyTransactions, forceReload)
    },
    [fetchTransactionsWithValue, showFamilyTransactions],
  )

  // Função para alternar entre transações pessoais e familiares
  const toggleFamilyTransactions = useCallback(() => {
    // Primeiro, limpar as transações existentes para feedback visual imediato
    setTransactions([])

    // Definir que estamos processando uma transação para mostrar o overlay correto
    setIsProcessingTransaction(true)

    // Atualizar o estado e usar o novo valor imediatamente
    setShowFamilyTransactions((prevState) => {
      const newValue = !prevState

      // Definir loading para true antes de iniciar o carregamento
      setLoading(true)

      // Importante: use o novo valor diretamente aqui, não o valor do estado anterior
      setTimeout(() => {
        // Passamos o novo valor diretamente para a função fetchTransactionsWithValue
        fetchTransactionsWithValue(newValue, true).finally(() => {
          // Garantir que o estado de processamento seja desativado quando terminar
          setTimeout(() => {
            setIsProcessingTransaction(false)
          }, 300) // Pequeno delay para uma transição mais suave
        })
      }, 0)

      return newValue
    })
  }, [fetchTransactionsWithValue])

  // Efeito para carregar transações inicialmente - agora espera o perfil ser inicializado
  useEffect(() => {
    // Só carrega as transações quando o perfil estiver inicializado
    if (profileInitialized && !initialLoadRef.current) {
      initialLoadRef.current = true
      fetchTransactions()
    }
  }, [fetchTransactions, profileInitialized, showFamilyTransactions])

  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, "id">) => {
      setIsProcessingTransaction(true)
      try {
        // Determinar se deve adicionar código familiar com base no toggle
        const shouldAddFamilyCode = showFamilyTransactions && (profile?.familyCode || profile?.associatedFamilyCode)

        const { data, error } = await supabase.from("transactions").insert([
          {
            ...transaction,
            user_id: profile?.id,
            family_code: shouldAddFamilyCode ? profile?.familyCode || profile?.associatedFamilyCode : null,
          },
        ])

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao adicionar transação",
            description: "Por favor, tente novamente.",
          })
          return
        }

        toast({
          title: "Transação adicionada",
          description: `Transação ${transaction.description} adicionada com sucesso.`,
        })

        fetchTransactions(true) // Recarrega as transações para atualizar a lista
      } finally {
        setIsProcessingTransaction(false)
      }
    },
    [supabase, profile, showFamilyTransactions, fetchTransactions, toast],
  )

  const updateTransaction = useCallback(
    async (transaction: Transaction) => {
      setIsProcessingTransaction(true)
      try {
        // Determinar se deve adicionar código familiar com base no toggle
        const shouldAddFamilyCode = showFamilyTransactions && (profile?.familyCode || profile?.associatedFamilyCode)

        const { data, error } = await supabase
          .from("transactions")
          .update({
            ...transaction,
            family_code: shouldAddFamilyCode ? profile?.familyCode || profile?.associatedFamilyCode : null,
          })
          .eq("id", transaction.id)

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao atualizar transação",
            description: "Por favor, tente novamente.",
          })
          return
        }

        toast({
          title: "Transação atualizada",
          description: `Transação ${transaction.description} atualizada com sucesso.`,
        })

        fetchTransactions(true) // Recarrega as transações para atualizar a lista
      } finally {
        setIsProcessingTransaction(false)
      }
    },
    [supabase, profile, showFamilyTransactions, fetchTransactions, toast],
  )

  const deleteTransaction = useCallback(
    async (id: string) => {
      setIsProcessingTransaction(true)
      try {
        const { error } = await supabase.from("transactions").delete().eq("id", id)

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao excluir transação",
            description: "Por favor, tente novamente.",
          })
          return
        }

        toast({
          title: "Transação excluída",
          description: "Transação excluída com sucesso.",
        })

        fetchTransactions(true) // Recarrega as transações para atualizar a lista
      } finally {
        setIsProcessingTransaction(false)
      }
    },
    [supabase, fetchTransactions, toast],
  )

  const getTransactionsByMonth = useCallback(
    (month: number, year: number) => {
      return transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        return transactionDate.getMonth() === month && transactionDate.getFullYear() === year
      })
    },
    [transactions],
  )

  const getTransactionsByDate = useCallback(
    (date: Date) => {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)

      return transactions.filter((transaction) => {
        const transactionDate = new Date(transaction.date)
        return transactionDate >= startOfDay && transactionDate <= endOfDay
      })
    },
    [transactions],
  )

  const getTransactionsByCategory = useCallback(
    (category: string) => {
      return transactions.filter((transaction) => transaction.category === category)
    },
    [transactions],
  )

  const getTransactionsByStatus = useCallback(
    (status: TransactionStatus) => {
      return transactions.filter((transaction) => transaction.status === status)
    },
    [transactions],
  )

  const getTotalByType = useCallback(
    (type: TransactionType, includesFuture = false) => {
      return transactions
        .filter((transaction) => transaction.type === type && (includesFuture || transaction.status === "realizada"))
        .reduce((acc, transaction) => acc + transaction.amount, 0)
    },
    [transactions],
  )

  const getBalance = useCallback(
    (includesFuture = false) => {
      const receitas = getTotalByType("receita", includesFuture)
      const despesas = getTotalByType("despesa", includesFuture)
      return receitas - despesas
    },
    [getTotalByType],
  )

  const getDailyTransactions = useCallback(
    (month: number, year: number) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const dailyTransactions: { date: string; receitas: number; despesas: number }[] = []

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        const transactionsOnDate = getTransactionsByDate(date)

        const receitas = transactionsOnDate.filter((t) => t.type === "receita").reduce((acc, t) => acc + t.amount, 0)

        const despesas = transactionsOnDate.filter((t) => t.type === "despesa").reduce((acc, t) => acc + t.amount, 0)

        dailyTransactions.push({
          date: date.toISOString().split("T")[0],
          receitas,
          despesas,
        })
      }

      return dailyTransactions
    },
    [getTransactionsByDate],
  )

  const getMonthlyTransactions = useCallback(
    (year: number) => {
      const monthlyTransactions: { month: string; receitas: number; despesas: number }[] = []

      for (let month = 0; month < 12; month++) {
        const transactionsInMonth = getTransactionsByMonth(month, year)

        const receitas = transactionsInMonth.filter((t) => t.type === "receita").reduce((acc, t) => acc + t.amount, 0)

        const despesas = transactionsInMonth.filter((t) => t.type === "despesa").reduce((acc, t) => acc + t.amount, 0)

        const monthName = new Date(year, month, 1).toLocaleString("default", { month: "long" })

        monthlyTransactions.push({
          month: monthName,
          receitas,
          despesas,
        })
      }

      return monthlyTransactions
    },
    [getTransactionsByMonth],
  )

  const getYearlyTransactions = useCallback(() => {
    const yearlyTransactions: { year: number; receitas: number; despesas: number }[] = []
    const years = [...new Set(transactions.map((t) => new Date(t.date).getFullYear()))]

    years.forEach((year) => {
      const transactionsInYear = transactions.filter((t) => new Date(t.date).getFullYear() === year)

      const receitas = transactionsInYear.filter((t) => t.type === "receita").reduce((acc, t) => acc + t.amount, 0)

      const despesas = transactionsInYear.filter((t) => t.type === "despesa").reduce((acc, t) => acc + t.amount, 0)

      yearlyTransactions.push({
        year: year,
        receitas: receitas,
        despesas: despesas,
      })
    })

    return yearlyTransactions
  }, [transactions])

  const formatCurrencyWithUserSettings = useCallback(
    (value: number) => {
      if (!profile) return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

      const { currency } = profile

      try {
        // Usar "pt-BR" como locale padrão em vez de tentar acessar profile.locale
        return value.toLocaleString("pt-BR", {
          style: "currency",
          currency: currency || "BRL",
        })
      } catch (error) {
        return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      }
    },
    [profile],
  )

  // Memoizar o valor do contexto para evitar renderizações desnecessárias
  const contextValue = useMemo(
    () => ({
      transactions,
      loading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionsByMonth,
      getTransactionsByDate,
      getTransactionsByCategory,
      getTransactionsByStatus,
      getTotalByType,
      getBalance,
      getDailyTransactions,
      getMonthlyTransactions,
      getYearlyTransactions,
      formatCurrencyWithUserSettings,
      isProcessingTransaction,
      showFamilyTransactions,
      toggleFamilyTransactions,
      hasFamilyCode: !!(profile?.familyCode || profile?.associatedFamilyCode),
    }),
    [
      transactions,
      loading,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionsByMonth,
      getTransactionsByDate,
      getTransactionsByCategory,
      getTransactionsByStatus,
      getTotalByType,
      getBalance,
      getDailyTransactions,
      getMonthlyTransactions,
      getYearlyTransactions,
      formatCurrencyWithUserSettings,
      isProcessingTransaction,
      showFamilyTransactions,
      toggleFamilyTransactions,
      profile,
    ],
  )

  return <FinanceContext.Provider value={contextValue}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider")
  }
  return context
}
