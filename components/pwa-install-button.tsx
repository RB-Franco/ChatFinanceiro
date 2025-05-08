"use client"

import { useEffect, useState } from "react"
import { Download } from "lucide-react"

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: any) => {
      console.log("[PWA] Evento beforeinstallprompt capturado!", e)
      // Prevenir comportamento padrão
      e.preventDefault()
      // Armazenar o evento
      setDeferredPrompt(e)
      // Armazenar globalmente também
      window.deferredPrompt = e
    }

    // Verificar se já existe um deferredPrompt
    if (window.deferredPrompt) {
      console.log("[PWA] deferredPrompt já existe na janela")
      setDeferredPrompt(window.deferredPrompt)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    console.log("[PWA] Tentando instalar, deferredPrompt:", deferredPrompt)

    if (deferredPrompt) {
      try {
        // Mostrar o prompt de instalação
        deferredPrompt.prompt()

        // Aguardar a escolha do usuário
        const choiceResult = await deferredPrompt.userChoice
        console.log("[PWA] Resultado da escolha:", choiceResult.outcome)

        // Limpar o prompt armazenado
        setDeferredPrompt(null)
        window.deferredPrompt = null
      } catch (error) {
        console.error("[PWA] Erro ao acionar prompt de instalação:", error)
        alert("Erro ao instalar: " + error)
      }
    } else if (isIOS) {
      alert(
        "Para instalar no iOS:\n1. Toque no botão de compartilhar (retângulo com seta)\n2. Role para baixo e toque em 'Adicionar à Tela de Início'",
      )
    } else {
      alert(
        "Para instalar:\n1. Toque no menu (três pontos) no canto superior direito\n2. Selecione 'Instalar aplicativo' ou 'Adicionar à tela inicial'",
      )
    }
  }

  if (isInstalled) return null

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-20 right-4 z-40 bg-green-600 text-white p-3 rounded-full shadow-lg"
      aria-label="Instalar aplicativo"
    >
      <Download size={24} />
    </button>
  )
}
