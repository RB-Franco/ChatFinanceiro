"use client"

import { useState, useEffect } from "react"
import { X, MoreVertical, Share2, Plus, Download } from "lucide-react"

export function PWAInstallModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [installationStatus, setInstallationStatus] = useState<
    "not-available" | "available" | "installed" | "installing"
  >("not-available")
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toISOString().slice(11, 19)}: ${info}`])
    console.log(`[PWA Install] ${info}`)
  }

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      addDebugInfo("Aplicativo já está instalado ou em modo standalone")
      setInstallationStatus("installed")
      return
    }

    // Detectar plataforma
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || ""
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
    const isAndroidDevice = /android/i.test(userAgent)

    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)

    addDebugInfo(`Plataforma detectada: ${isIOSDevice ? "iOS" : isAndroidDevice ? "Android" : "Desktop/Outro"}`)

    // Verificar se o evento já foi armazenado globalmente
    if (window.deferredPrompt) {
      addDebugInfo("Evento beforeinstallprompt já capturado globalmente")
      setDeferredPrompt(window.deferredPrompt)
      setInstallationStatus("available")
      setTimeout(() => {
        setIsOpen(true)
      }, 3000)
    }

    // Função para capturar o evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevenir o comportamento padrão
      e.preventDefault()

      addDebugInfo("Evento beforeinstallprompt capturado")

      // Armazenar o evento para uso posterior
      setDeferredPrompt(e)
      window.deferredPrompt = e
      setInstallationStatus("available")

      // Mostrar o modal após 3 segundos
      setTimeout(() => {
        setIsOpen(true)
      }, 3000)
    }

    // Adicionar listener para o evento
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Verificar se o app foi instalado
    window.addEventListener("appinstalled", (e) => {
      addDebugInfo("Aplicativo instalado com sucesso")
      setIsOpen(false)
      setInstallationStatus("installed")
      setDeferredPrompt(null)
      window.deferredPrompt = null
    })

    // Se for iOS, mostrar o modal após 3 segundos
    if (isIOSDevice && !window.matchMedia("(display-mode: standalone)").matches) {
      addDebugInfo("Dispositivo iOS detectado, mostrando instruções de instalação")
      setInstallationStatus("available")
      setTimeout(() => {
        setIsOpen(true)
      }, 3000)
    }

    // Verificar se o manifesto está presente
    const manifestLink = document.querySelector('link[rel="manifest"]')
    if (!manifestLink) {
      addDebugInfo("ERRO: Link para o manifesto não encontrado no documento")
    } else {
      addDebugInfo(`Manifesto encontrado: ${manifestLink.getAttribute("href")}`)
    }

    // Verificar se o service worker está registrado
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          if (registrations.length > 0) {
            addDebugInfo(`Service Worker registrado: ${registrations.length} registros`)
            registrations.forEach((reg, i) => {
              addDebugInfo(
                `SW ${i + 1}: escopo=${reg.scope}, atualizando=${!!reg.installing}, esperando=${!!reg.waiting}, ativo=${!!reg.active}`,
              )
            })
          } else {
            addDebugInfo("ERRO: Nenhum Service Worker registrado")
          }
        })
        .catch((err) => {
          addDebugInfo(`ERRO ao verificar Service Worker: ${err}`)
        })
    } else {
      addDebugInfo("ERRO: Service Worker não suportado neste navegador")
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (installationStatus !== "available") {
      addDebugInfo(`Instalação não disponível. Status atual: ${installationStatus}`)
      return
    }

    if (deferredPrompt) {
      addDebugInfo("Iniciando instalação via prompt")
      setInstallationStatus("installing")

      try {
        // Mostrar o prompt de instalação
        deferredPrompt.prompt()

        // Esperar pela escolha do usuário
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === "accepted") {
          addDebugInfo("Usuário aceitou a instalação")
          setInstallationStatus("installed")
        } else {
          addDebugInfo("Usuário recusou a instalação")
          setInstallationStatus("available")
        }

        // Limpar o prompt
        setDeferredPrompt(null)
        window.deferredPrompt = null
      } catch (error) {
        addDebugInfo(`ERRO durante a instalação: ${error}`)
        setInstallationStatus("available")
      }
    }

    // Fechar o modal
    setIsOpen(false)
  }

  const handleClose = () => {
    addDebugInfo("Modal fechado pelo usuário")
    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
        <div className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Instale o FinanceChat</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-6">Instale o FinanceChat para ter acesso rápido às suas finanças mesmo offline!</p>

          {isIOS ? (
            <div className="space-y-4">
              <ol className="list-decimal pl-5 space-y-2">
                <li className="flex items-center">
                  Toque no botão de compartilhamento <Share2 className="inline-block ml-2 h-5 w-5 text-blue-500" />
                </li>
                <li>Role para baixo e selecione "Adicionar à Tela de Início"</li>
                <li>Toque em "Adicionar" na janela que aparecer</li>
              </ol>
            </div>
          ) : isAndroid ? (
            <div className="space-y-4">
              <ol className="list-decimal pl-5 space-y-2">
                <li className="flex items-center">
                  Toque no menu de três pontos <MoreVertical className="inline-block ml-2 h-5 w-5 text-blue-500" />
                </li>
                <li>Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"</li>
                <li>Toque em "Instalar" na janela que aparecer</li>
              </ol>
            </div>
          ) : (
            <div className="space-y-4">
              <ol className="list-decimal pl-5 space-y-2">
                <li className="flex items-center">
                  Clique no ícone de instalação <Plus className="inline-block ml-2 h-5 w-5 text-blue-500" /> na barra de
                  endereço
                </li>
                <li>Ou use o menu do navegador e selecione "Instalar FinanceChat..."</li>
                <li>Clique em "Instalar" na janela que aparecer</li>
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

            {!isIOS && (
              <button
                onClick={handleInstall}
                disabled={installationStatus !== "available"}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Download className="mr-2 h-4 w-4" />
                Instalar
              </button>
            )}
          </div>

          {process.env.NODE_ENV !== "production" && debugInfo.length > 0 && (
            <div className="mt-4 border-t pt-4">
              <details>
                <summary className="cursor-pointer text-sm text-gray-500">Informações de depuração</summary>
                <div className="mt-2 bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto max-h-[200px]">
                  {debugInfo.map((info, i) => (
                    <div key={i}>{info}</div>
                  ))}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
