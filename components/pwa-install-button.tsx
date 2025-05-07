"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useEffect, useState } from "react"

export function PWAInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true)
      return
    }

    // Verificar se há um prompt de instalação armazenado
    if (window.deferredPrompt) {
      setInstallPrompt(window.deferredPrompt)
      setIsInstallable(true)
    }

    // Adicionar listener para o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir o comportamento padrão
      e.preventDefault()

      // Armazenar o evento
      setInstallPrompt(e)
      setIsInstallable(true)

      // Também armazenar globalmente
      window.deferredPrompt = e
    }

    // Adicionar listener para o evento appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setInstallPrompt(null)
      window.deferredPrompt = null
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) return

    // Mostrar o prompt de instalação
    installPrompt.prompt()

    // Aguardar a escolha do usuário
    const { outcome } = await installPrompt.userChoice

    // Limpar o prompt após a escolha
    setInstallPrompt(null)
    window.deferredPrompt = null

    if (outcome === "accepted") {
      setIsInstalled(true)
    }
  }

  if (isInstalled || !isInstallable) {
    return null
  }

  return (
    <Button
      onClick={handleInstallClick}
      className="install-pwa-button flex items-center gap-2"
      variant="outline"
      size="sm"
    >
      <Download className="h-4 w-4" />
      Instalar App
    </Button>
  )
}
