"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Add global error handler
    const handleError = (event: ErrorEvent) => {
      console.error("Caught in error boundary:", event.error)
      setError(event.error)
      setHasError(true)
      event.preventDefault()
    }

    // Add global unhandled rejection handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason)
      setError(new Error(String(event.reason)))
      setHasError(true)
      event.preventDefault()
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
    }
  }, [])

  const handleReset = () => {
    setHasError(false)
    setError(null)
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="max-w-md w-full bg-card border rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4 text-amber-500">
            <AlertTriangle className="h-8 w-8" />
            <h2 className="text-xl font-bold">Algo deu errado</h2>
          </div>

          <div className="bg-muted/30 p-4 rounded-md mb-4 overflow-auto max-h-[200px]">
            <p className="font-medium mb-2">Detalhes do erro:</p>
            <p className="text-sm text-muted-foreground font-mono whitespace-pre-wrap">
              {error?.message || "Erro desconhecido"}
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar página
            </Button>
            <Button onClick={handleReset}>Continuar</Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
