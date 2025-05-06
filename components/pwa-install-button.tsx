"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)

  useEffect(() => {
    // Detectar se é iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Capturar o evento beforeinstallprompt (só funciona em Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevenir o comportamento padrão
      e.preventDefault()
      // Armazenar o evento para uso posterior
      setDeferredPrompt(e)
      // Mostrar o botão de instalação
      setIsInstallable(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      // Mostrar instruções para iOS
      setShowIOSInstructions(true)
    } else if (deferredPrompt) {
      // Mostrar o prompt de instalação
      deferredPrompt.prompt()

      // Aguardar a resposta do usuário
      const { outcome } = await deferredPrompt.userChoice

      // Limpar o prompt armazenado
      setDeferredPrompt(null)
      setIsInstallable(false)

      // Registrar o resultado (opcional)
      console.log(`Resultado da instalação: ${outcome}`)
    }
  }

  if (!isInstallable && !isIOS) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {showIOSInstructions && isIOS ? (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg max-w-xs">
          <h3 className="font-bold mb-2">Instalar no iOS:</h3>
          <ol className="list-decimal pl-5 text-sm space-y-1">
            <li>
              Toque no ícone de compartilhamento{" "}
              <span className="inline-block w-5 h-5 text-center border rounded">↑</span>
            </li>
            <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
            <li>Toque em "Adicionar" no canto superior</li>
          </ol>
          <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => setShowIOSInstructions(false)}>
            Fechar
          </Button>
        </div>
      ) : (
        <Button onClick={handleInstallClick} className="shadow-lg flex items-center gap-2">
          <Download size={16} />
          Instalar Aplicativo
        </Button>
      )}
    </div>
  )
}
