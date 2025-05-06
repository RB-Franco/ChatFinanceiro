"use client"

import { useEffect, useState } from "react"

// Tipo para transações
interface Transaction {
  id: string
  amount: number
  description: string
  date: string
  category: string
  type: "income" | "expense"
}

export function useOfflineStorage() {
  const [isInitialized, setIsInitialized] = useState(false)

  // Inicializar o armazenamento local
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Verificar se o IndexedDB está disponível
      if (!("indexedDB" in window)) {
        console.warn("IndexedDB não está disponível neste navegador")
        return
      }

      initializeDB()
        .then(() => {
          setIsInitialized(true)
        })
        .catch((error) => {
          console.error("Erro ao inicializar o banco de dados:", error)
        })
    }
  }, [])

  // Salvar uma transação localmente
  const saveTransaction = async (transaction: Transaction): Promise<boolean> => {
    if (!isInitialized) return false

    try {
      const db = await openDB()
      const tx = db.transaction("transactions", "readwrite")
      const store = tx.objectStore("transactions")

      // Adicionar flag para indicar que está pendente de sincronização
      const transactionToSave = {
        ...transaction,
        pendingSync: true,
        createdAt: new Date().toISOString(),
      }

      await store.add(transactionToSave)
      await tx.complete

      // Tentar sincronizar se estiver online
      if (navigator.onLine && "serviceWorker" in navigator && "SyncManager" in window) {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register("sync-transactions")
      }

      return true
    } catch (error) {
      console.error("Erro ao salvar transação offline:", error)
      return false
    }
  }

  // Obter transações armazenadas localmente
  const getLocalTransactions = async (): Promise<Transaction[]> => {
    if (!isInitialized) return []

    try {
      const db = await openDB()
      const tx = db.transaction("transactions", "readonly")
      const store = tx.objectStore("transactions")
      const transactions = await store.getAll()

      return transactions
    } catch (error) {
      console.error("Erro ao obter transações locais:", error)
      return []
    }
  }

  // Marcar transações como sincronizadas
  const markAsSynced = async (ids: string[]): Promise<boolean> => {
    if (!isInitialized || ids.length === 0) return false

    try {
      const db = await openDB()
      const tx = db.transaction("transactions", "readwrite")
      const store = tx.objectStore("transactions")

      for (const id of ids) {
        const transaction = await store.get(id)
        if (transaction) {
          transaction.pendingSync = false
          await store.put(transaction)
        }
      }

      await tx.complete
      return true
    } catch (error) {
      console.error("Erro ao marcar transações como sincronizadas:", error)
      return false
    }
  }

  // Funções auxiliares para o IndexedDB
  const initializeDB = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("FinanceDashboardDB", 1)

      request.onerror = () => {
        reject(new Error("Erro ao abrir o banco de dados"))
      }

      request.onsuccess = () => {
        resolve(true)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Criar object store para transações
        if (!db.objectStoreNames.contains("transactions")) {
          const store = db.createObjectStore("transactions", { keyPath: "id" })
          store.createIndex("pendingSync", "pendingSync", { unique: false })
          store.createIndex("createdAt", "createdAt", { unique: false })
        }
      }
    })
  }

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("FinanceDashboardDB", 1)

      request.onerror = () => {
        reject(new Error("Erro ao abrir o banco de dados"))
      }

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result)
      }
    })
  }

  return {
    isInitialized,
    saveTransaction,
    getLocalTransactions,
    markAsSynced,
  }
}
