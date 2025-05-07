"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useEffect, useState } from "react"

export function PWAInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches

    // Função para capturar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevenir o comportamento padrão
      e.preventDefault()

      // Armazenar o evento para uso posterior
      setInstallPrompt(e)
      setIsVisible(true)

      console.log("App pode ser instalado - evento capturado")
    }

    // Verificar se o evento já foi armazenado globalmente
    if (window.deferredPrompt) {
      setInstallPrompt(window.deferredPrompt)
      setIsVisible(true)
    }

    // Adicionar listener para o evento
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Verificar se o app foi instalado
    window.addEventListener("appinstalled", () => {
      setIsVisible(false)
      console.log("App foi instalado")
    })

    // Forçar visibilidade do botão em dispositivos móveis para teste
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile && !isStandalone) {
      // Mostrar o botão após 2 segundos em dispositivos móveis para teste
      setTimeout(() => {
        setIsVisible(true)
      }, 2000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) {
      // Se não temos o prompt, mas estamos em um dispositivo iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

      if (isIOS) {
        alert(
          "Para instalar este app no seu iPhone: toque no ícone de compartilhamento e depois em 'Adicionar à Tela de Início'",
        )
        return
      }

      // Para outros dispositivos onde o prompt não está disponível
      alert("Para instalar este app, abra-o no Chrome e toque em 'Adicionar à tela inicial'")
      return
    }

    // Mostrar o prompt de instalação
    installPrompt.prompt()

    // Esperar pela escolha do usuário
    const choiceResult = await installPrompt.userChoice

    if (choiceResult.outcome === "accepted") {
      console.log("Usuário aceitou a instalação")
    } else {
      console.log("Usuário recusou a instalação")
    }

    // Limpar o prompt
    setInstallPrompt(null)
  }

  if (!isVisible) return null

  return (
    <Button onClick={handleInstallClick} className="fixed bottom-20 right-4 z-50 shadow-lg rounded-full" size="sm">
      <Download className="mr-2 h-4 w-4" />
      Instalar App
    </Button>
  )
}
