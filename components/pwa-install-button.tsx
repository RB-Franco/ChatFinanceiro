"use client"

import { useState, useEffect } from "react"
import { Download } from "lucide-react"

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Verificar se o evento já foi armazenado globalmente
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt)
      setIsInstallable(true)
    }

    // Função para capturar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevenir o comportamento padrão
      e.preventDefault()
      console.log("Evento beforeinstallprompt capturado")

      // Armazenar o evento para uso posterior
      setDeferredPrompt(e)
      window.deferredPrompt = e
      setIsInstallable(true)
    }

    // Adicionar listener para o evento
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Verificar se o app foi instalado
    window.addEventListener("appinstalled", () => {
      console.log("Aplicativo instalado com sucesso")
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      window.deferredPrompt = null
    })

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      console.log("Prompt de instalação não disponível")
      return
    }

    // Mostrar o prompt de instalação
    deferredPrompt.prompt()

    // Esperar pela escolha do usuário
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("Usuário aceitou a instalação")
      setIsInstalled(true)
    } else {
      console.log("Usuário recusou a instalação")
    }

    // Limpar o prompt
    setDeferredPrompt(null)
    window.deferredPrompt = null
    setIsInstallable(false)
  }

  if (!isInstallable || isInstalled) {
    return null
  }

  return (
    <button
      id="pwa-install-button"
      onClick={handleInstall}
      className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 z-50"
      aria-label="Instalar aplicativo"
    >
      <Download className="h-6 w-6" />
    </button>
  )
}
