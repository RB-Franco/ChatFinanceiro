"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

export function PWAMiniInfobar() {
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Verificar se o usuário já dispensou o banner
    const dismissed = localStorage.getItem("pwa-infobar-dismissed")
    if (dismissed === "true") {
      setDismissed(true)
      return
    }

    // Mostrar o banner após um pequeno atraso para simular o comportamento nativo
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setDismissed(true)
    localStorage.setItem("pwa-infobar-dismissed", "true")
  }

  const handleInstall = () => {
    // Abrir o menu do Chrome com instruções
    alert(
      "Para instalar o aplicativo:\n\n1. Toque nos três pontos (⋮) no canto superior direito\n2. Selecione 'Instalar aplicativo' ou 'Adicionar à tela inicial'\n\nSe a opção não aparecer, tente recarregar a página e tentar novamente.",
    )

    // Registrar no localStorage que o usuário tentou instalar
    localStorage.setItem("pwa-install-attempted", "true")
  }

  if (isInstalled || dismissed || !isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-3 flex items-center justify-between z-50 shadow-lg animate-slide-up">
      <div className="flex items-center">
        <div className="bg-white rounded-full p-2 mr-3">
          <img src="/icons/icon-192x192.png" alt="Logo" className="w-6 h-6" />
        </div>
        <div>
          <div className="font-medium">Instale o FinanceChat</div>
          <div className="text-xs text-gray-300">chat-financeiro.vercel.app</div>
        </div>
      </div>
      <div className="flex items-center">
        <button
          onClick={handleInstall}
          className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-medium mr-2"
        >
          Instalar
        </button>
        <button onClick={handleDismiss} className="p-1">
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
