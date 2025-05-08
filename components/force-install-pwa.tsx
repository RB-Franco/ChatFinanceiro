"use client"

import { useEffect, useState } from "react"
import { X, Download } from "lucide-react"

export function ForceInstallPWA() {
  const [showBanner, setShowBanner] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Coletar informações de debug
    const info = {
      userAgent: navigator.userAgent,
      standalone: (window.navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches,
      serviceWorker: "serviceWorker" in navigator,
      online: navigator.onLine,
      display: window.innerWidth + "x" + window.innerHeight,
    }
    setDebugInfo(info)

    // Forçar a instalação após 2 segundos
    const timer = setTimeout(() => {
      if (!isInstalled) {
        setShowBanner(true)
      }
    }, 2000)

    // Capturar evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log("[PWA] Evento beforeinstallprompt capturado!")
      e.preventDefault()
      setDeferredPrompt(e)
      setDebugInfo((prev) => ({ ...prev, hasBeforeInstallPrompt: true }))
      setShowBanner(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      clearTimeout(timer)
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [isInstalled])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      console.log(`[PWA] Resultado da instalação: ${outcome}`)
      if (outcome === "accepted") {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    } else {
      // Se não temos o prompt, mostrar instruções manuais
      setShowDebug(true)
    }
  }

  if (isInstalled) return null

  return (
    <>
      {/* Banner de instalação */}
      {showBanner && (
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
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Instalar
                </button>
              )}
              <button
                onClick={() => setShowBanner(false)}
                className="p-1 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botão flutuante para instalação */}
      {!showBanner && !isIOS && (
        <button
          onClick={() => setShowBanner(true)}
          className="fixed bottom-20 right-4 z-40 bg-green-600 text-white p-3 rounded-full shadow-lg"
          aria-label="Instalar aplicativo"
        >
          <Download size={24} />
        </button>
      )}

      {/* Debug overlay */}
      {showDebug && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-4 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Instruções de Instalação</h2>
              <button
                onClick={() => setShowDebug(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="font-medium">Para instalar no Chrome:</h3>
                <ol className="list-decimal pl-5 space-y-2 mt-2">
                  <li>Toque no menu (três pontos) no canto superior direito</li>
                  <li>Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"</li>
                  <li>Confirme a instalação</li>
                </ol>
              </div>

              <div className="border-b pb-2">
                <h3 className="font-medium">Para instalar no Safari (iOS):</h3>
                <ol className="list-decimal pl-5 space-y-2 mt-2">
                  <li>Toque no botão de compartilhar (retângulo com seta)</li>
                  <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
                  <li>Toque em "Adicionar" no canto superior direito</li>
                </ol>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => {
                    if ("serviceWorker" in navigator) {
                      navigator.serviceWorker.getRegistrations().then((registrations) => {
                        for (const registration of registrations) {
                          registration.unregister()
                        }
                        caches
                          .keys()
                          .then((cacheNames) => {
                            return Promise.all(
                              cacheNames.map((cacheName) => {
                                return caches.delete(cacheName)
                              }),
                            )
                          })
                          .then(() => {
                            window.location.reload()
                          })
                      })
                    }
                  }}
                  className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Reiniciar Aplicação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
