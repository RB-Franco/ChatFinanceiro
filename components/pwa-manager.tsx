"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"

export function PWAManager() {
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [swActive, setSwActive] = useState(false)
  const [installable, setInstallable] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Registrar o service worker
  useEffect(() => {
    async function registerSW() {
      if ("serviceWorker" in navigator) {
        try {
          // Remover service workers antigos
          const registrations = await navigator.serviceWorker.getRegistrations()
          for (const registration of registrations) {
            await registration.unregister()
          }

          // Registrar novo service worker
          console.log("[PWA] Tentando registrar o Service Worker...")
          const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" })
          console.log("[PWA] Service Worker registrado com sucesso:", registration.scope)
          setSwRegistration(registration)
          setError(null)

          // Verificar se o service worker está ativo
          if (registration.active) {
            setSwActive(true)
            console.log("[PWA] Service Worker já está ativo")
          }

          // Monitorar mudanças de estado
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              console.log("[PWA] Novo Service Worker encontrado, estado:", newWorker.state)
              newWorker.addEventListener("statechange", () => {
                console.log("[PWA] Service Worker state changed:", newWorker.state)
                if (newWorker.state === "activated") {
                  setSwActive(true)
                  console.log("[PWA] Service Worker ativado com sucesso")
                }
              })
            }
          })
        } catch (error) {
          console.error("[PWA] Falha ao registrar o Service Worker:", error)
          setError(String(error))
        }
      } else {
        console.warn("[PWA] Service Workers não são suportados neste navegador")
        setError("Service Workers não são suportados neste navegador")
      }
    }

    registerSW()

    // Limpar ao desmontar
    return () => {
      if (swRegistration) {
        // Não desregistrar, apenas limpar o estado
        setSwRegistration(null)
      }
    }
  }, [])

  // Capturar o evento beforeinstallprompt
  useEffect(() => {
    function handleBeforeInstallPrompt(e: any) {
      // Prevenir o comportamento padrão
      e.preventDefault()
      console.log("[PWA] Evento beforeinstallprompt capturado")

      // Armazenar o evento
      setDeferredPrompt(e)
      setInstallable(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    // Verificar se o app já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      console.log("[PWA] Aplicativo já está instalado como PWA")
    }

    // Capturar evento de instalação
    window.addEventListener("appinstalled", () => {
      console.log("[PWA] Aplicativo instalado com sucesso")
      setDeferredPrompt(null)
      setInstallable(false)
      toast({
        title: "Aplicativo instalado",
        description: "O FinanceChat foi instalado com sucesso!",
        duration: 5000,
      })
    })

    // Capturar mensagens do service worker
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("[PWA] Mensagem recebida do Service Worker:", event.data)
        if (event.data.type === "SW_ACTIVATED") {
          setSwActive(true)
        }
      })
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  // Função para instalar o app
  const installApp = async () => {
    if (!deferredPrompt) {
      console.log("[PWA] Nenhum prompt de instalação disponível")
      toast({
        title: "Instalação manual necessária",
        description: "Use o menu do navegador para instalar o aplicativo",
        duration: 5000,
      })
      return
    }

    try {
      // Mostrar o prompt de instalação
      deferredPrompt.prompt()

      // Aguardar a escolha do usuário
      const choiceResult = await deferredPrompt.userChoice

      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] Usuário aceitou a instalação")
      } else {
        console.log("[PWA] Usuário recusou a instalação")
      }

      // Limpar o prompt
      setDeferredPrompt(null)
      setInstallable(false)
    } catch (error) {
      console.error("[PWA] Erro ao tentar instalar:", error)
      toast({
        title: "Erro na instalação",
        description: "Ocorreu um erro ao tentar instalar o aplicativo",
        variant: "destructive",
        duration: 5000,
      })
    }
  }

  // Função para forçar a atualização do service worker
  const updateServiceWorker = async () => {
    if (swRegistration) {
      try {
        await swRegistration.update()
        toast({
          title: "Atualização verificada",
          description: "Verificando atualizações do service worker",
          duration: 3000,
        })
      } catch (error) {
        console.error("[PWA] Erro ao atualizar o service worker:", error)
      }
    }
  }

  // Função para limpar o cache
  const clearCache = async () => {
    if ("caches" in window) {
      try {
        const cacheNames = await window.caches.keys()
        await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)))
        toast({
          title: "Cache limpo",
          description: "Todo o cache foi removido com sucesso",
          duration: 3000,
        })
      } catch (error) {
        console.error("[PWA] Erro ao limpar o cache:", error)
      }
    }
  }

  // Função para recarregar a página
  const reloadPage = () => {
    window.location.reload()
  }

  // Renderizar o componente
  return (
    <>
      {/* Botão de instalação (visível apenas quando instalável) */}
      {installable && !window.matchMedia("(display-mode: standalone)").matches && (
        <div className="fixed bottom-4 left-0 right-0 z-50 mx-auto max-w-md p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/icons/icon-96x96.png" alt="FinanceChat" className="w-10 h-10" />
              <div>
                <h3 className="font-medium">Instalar FinanceChat</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Acesse mais rápido</p>
              </div>
            </div>
            <Button onClick={installApp} className="bg-blue-500 hover:bg-blue-600">
              Instalar
            </Button>
          </div>
        </div>
      )}

      {/* Painel de depuração (visível apenas quando showDebug é true) */}
      {showDebug && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-medium">PWA Debug</h2>
              <button onClick={() => setShowDebug(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Status</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500 dark:text-gray-400">Service Worker:</div>
                  <div className={swRegistration ? "text-green-500" : "text-red-500"}>
                    {swRegistration ? "Registrado" : "Não registrado"}
                  </div>

                  <div className="text-gray-500 dark:text-gray-400">Service Worker Ativo:</div>
                  <div className={swActive ? "text-green-500" : "text-red-500"}>{swActive ? "Sim" : "Não"}</div>

                  <div className="text-gray-500 dark:text-gray-400">Instalável:</div>
                  <div className={installable ? "text-green-500" : "text-gray-500"}>{installable ? "Sim" : "Não"}</div>

                  <div className="text-gray-500 dark:text-gray-400">Modo:</div>
                  <div>{window.matchMedia("(display-mode: standalone)").matches ? "Standalone" : "Browser"}</div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-md text-sm">
                  <strong>Erro:</strong> {error}
                </div>
              )}

              <div className="space-y-2">
                <h3 className="font-medium">Ações</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={installApp} disabled={!installable} className="w-full">
                    Forçar Instalação
                  </Button>

                  <Button onClick={updateServiceWorker} variant="outline" className="w-full">
                    Atualizar Service Worker
                  </Button>

                  <Button onClick={clearCache} variant="outline" className="w-full">
                    Limpar Cache
                  </Button>

                  <Button onClick={reloadPage} variant="outline" className="w-full">
                    Recarregar Página
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão de depuração (sempre visível, mas discreto) */}
      <button
        onClick={() => setShowDebug(true)}
        className="fixed top-20 right-4 z-40 w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shadow-md"
        aria-label="PWA Debug"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
          <path d="M12 18v.01"></path>
          <path d="M12 13a1.5 1.5 0 0 0 1.5-1.5v-2a1.5 1.5 0 0 0-3 0v2A1.5 1.5 0 0 0 12 13z"></path>
        </svg>
      </button>
    </>
  )
}
