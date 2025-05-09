"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function PWAInstallButton() {
  const [showInstall, setShowInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstall(false)
      return
    }

    // Mostrar botão após 3 segundos
    const timer = setTimeout(() => {
      setShowInstall(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (!showInstall) return null

  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto max-w-md p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img src="/icons/icon-96x96.png" alt="FinanceChat" className="w-10 h-10" />
          <div>
            <h3 className="font-medium">Instalar FinanceChat</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isIOS
                ? 'Toque em "Compartilhar" e depois "Adicionar à Tela de Início"'
                : 'Toque em "Instalar" para adicionar à tela inicial'}
            </p>
          </div>
        </div>
        {!isIOS && (
          <Button
            onClick={() => {
              alert(
                'Para instalar, toque nos três pontos (⋮) no canto superior direito e selecione "Instalar aplicativo" ou "Adicionar à tela inicial"',
              )
              setShowInstall(false)
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Instalar
          </Button>
        )}
        <button
          onClick={() => setShowInstall(false)}
          className="ml-2 text-gray-500 hover:text-gray-700"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
