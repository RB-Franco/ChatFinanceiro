"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

export function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Capturar evento de instalação para Android/Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Se for iOS, mostrar banner de qualquer forma após 2 segundos
    if (iOS) {
      const timer = setTimeout(() => {
        setShowBanner(true)
      }, 2000)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`Resultado da instalação: ${outcome}`)
      setDeferredPrompt(null)
      setShowBanner(false)
    }
  }

  const closeBanner = () => {
    setShowBanner(false)
    // Armazenar preferência do usuário por 24 horas
    localStorage.setItem("pwa-banner-closed", Date.now().toString())
  }

  // Não mostrar se já estiver instalado ou se o usuário fechou recentemente
  if (isInstalled || !showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white dark:bg-gray-800 shadow-lg border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <img src="/icons/icon-192x192.png" alt="Logo" className="w-10 h-10 rounded-lg" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Instale o FinanceChat</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isIOS
                ? 'Toque em "Compartilhar" e depois "Adicionar à Tela de Início"'
                : "Instale para acesso rápido e offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {!isIOS && (
            <button
              onClick={handleInstall}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Instalar
            </button>
          )}
          <button
            onClick={closeBanner}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
