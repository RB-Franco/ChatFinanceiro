"use client"

import { useState, useEffect } from "react"
import { X, MoreVertical } from "lucide-react"

export function PWAInstallModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return
    }

    // Verificar se é iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    // Função para capturar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevenir o comportamento padrão
      e.preventDefault()

      // Armazenar o evento para uso posterior
      setDeferredPrompt(e)

      // Mostrar o modal após 3 segundos
      setTimeout(() => {
        setIsOpen(true)
      }, 3000)

      console.log("App pode ser instalado - evento capturado")
    }

    // Verificar se o evento já foi armazenado globalmente
    if (window.deferredPrompt) {
      setDeferredPrompt(window.deferredPrompt)
      setTimeout(() => {
        setIsOpen(true)
      }, 3000)
    }

    // Adicionar listener para o evento
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Verificar se o app foi instalado
    window.addEventListener("appinstalled", () => {
      setIsOpen(false)
      console.log("App foi instalado")
    })

    // Se for iOS, mostrar o modal após 3 segundos
    if (isIOSDevice) {
      setTimeout(() => {
        setIsOpen(true)
      }, 3000)
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt && !isIOS) {
      console.log("Prompt de instalação não disponível")
      return
    }

    if (deferredPrompt) {
      // Mostrar o prompt de instalação
      deferredPrompt.prompt()

      // Esperar pela escolha do usuário
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        console.log("Usuário aceitou a instalação")
      } else {
        console.log("Usuário recusou a instalação")
      }

      // Limpar o prompt
      setDeferredPrompt(null)
      window.deferredPrompt = null
    }

    // Fechar o modal
    setIsOpen(false)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Instale o FinanceChat</h2>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-6">Instale o FinanceChat para ter acesso rápido às suas finanças mesmo offline!</p>

          {isIOS ? (
            <div className="space-y-4">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Toque no botão de compartilhamento{" "}
                  <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.59 16.59L13.17 12L8.59 7.41L10 6L16 12L10 18L8.59 16.59Z" fill="currentColor" />
                    </svg>
                  </span>
                </li>
                <li>Role para baixo e selecione "Adicionar à Tela de Início"</li>
                <li>Toque em "Adicionar" na janela que aparecer</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-4">
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Toque no menu de três pontos <MoreVertical className="inline h-5 w-5" />
                </li>
                <li>Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"</li>
                <li>Toque em "Instalar" na janela que aparecer</li>
              </ol>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Depois
            </button>

            <button onClick={handleInstall} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Instalar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
