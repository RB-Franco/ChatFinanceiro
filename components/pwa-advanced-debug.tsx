"use client"

import { useEffect, useState } from "react"
import { X, RefreshCw, AlertTriangle, CheckCircle } from "lucide-react"

export function PWAAdvancedDebug() {
  const [isOpen, setIsOpen] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [installEvents, setInstallEvents] = useState<string[]>([])
  const [criteria, setCriteria] = useState<{ [key: string]: boolean }>({})
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // Coletar informações básicas
    const gatherDebugInfo = () => {
      const info = {
        userAgent: navigator.userAgent,
        standalone: (window.navigator as any).standalone || window.matchMedia("(display-mode: standalone)").matches,
        serviceWorker: "serviceWorker" in navigator,
        online: navigator.onLine,
        platform: navigator.platform,
        manifestLink: !!document.querySelector('link[rel="manifest"]'),
        display: window.innerWidth + "x" + window.innerHeight,
        https: window.location.protocol === "https:",
        host: window.location.host,
        pathname: window.location.pathname,
        deferredPrompt: !!window.deferredPrompt,
        timestamp: new Date().toISOString(),
      }

      setDebugInfo(info)
    }

    // Verificar critérios de instalabilidade
    const checkInstallabilityCriteria = async () => {
      const criteriaChecks = {
        https: window.location.protocol === "https:",
        serviceWorker: "serviceWorker" in navigator,
        manifestExists: !!document.querySelector('link[rel="manifest"]'),
        manifestValid: false,
        hasIcons: false,
        serviceWorkerActive: false,
      }

      // Verificar manifesto
      try {
        const manifestLink = document.querySelector('link[rel="manifest"]')
        if (manifestLink) {
          const manifestResponse = await fetch(manifestLink.getAttribute("href") || "")
          if (manifestResponse.ok) {
            const manifest = await manifestResponse.json()
            criteriaChecks.manifestValid = !!(manifest.name && manifest.display && manifest.start_url)
            criteriaChecks.hasIcons = !!(manifest.icons && manifest.icons.length > 0)

            // Adicionar detalhes do manifesto ao debug
            setDebugInfo((prev) => ({
              ...prev,
              manifest: {
                name: manifest.name,
                shortName: manifest.short_name,
                display: manifest.display,
                startUrl: manifest.start_url,
                iconsCount: manifest.icons?.length || 0,
              },
            }))
          }
        }
      } catch (error) {
        console.error("[PWA Debug] Erro ao verificar manifesto:", error)
      }

      // Verificar service worker
      if ("serviceWorker" in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations()
          criteriaChecks.serviceWorkerActive = registrations.length > 0

          // Adicionar detalhes do service worker ao debug
          if (registrations.length > 0) {
            setDebugInfo((prev) => ({
              ...prev,
              serviceWorkerDetails: {
                count: registrations.length,
                scope: registrations[0].scope,
                state: registrations[0].active
                  ? "active"
                  : registrations[0].installing
                    ? "installing"
                    : registrations[0].waiting
                      ? "waiting"
                      : "unknown",
              },
            }))
          }
        } catch (error) {
          console.error("[PWA Debug] Erro ao verificar service worker:", error)
        }
      }

      setCriteria(criteriaChecks)
    }

    gatherDebugInfo()
    checkInstallabilityCriteria()

    // Monitorar eventos relacionados à PWA
    const logEvent = (eventName: string) => {
      setInstallEvents((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${eventName}`])
      console.log(`[PWA Debug] Evento: ${eventName}`)
    }

    // Capturar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      logEvent("beforeinstallprompt capturado")
      setDeferredPrompt(e)
      window.deferredPrompt = e
      setDebugInfo((prev) => ({ ...prev, hasBeforeInstallPrompt: true }))
    }

    // Capturar evento appinstalled
    const handleAppInstalled = () => {
      logEvent("appinstalled - Aplicativo instalado com sucesso")
      setDeferredPrompt(null)
      window.deferredPrompt = null
    }

    // Monitorar mudanças no service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        logEvent("controllerchange - Service Worker controlador alterado")
      })
    }

    // Monitorar mudanças no modo de exibição
    window.matchMedia("(display-mode: standalone)").addEventListener("change", (e) => {
      logEvent(`display-mode alterado: ${e.matches ? "standalone" : "browser"}`)
      gatherDebugInfo()
    })

    // Registrar eventos
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // Verificar se já existe um deferredPrompt
    if (window.deferredPrompt) {
      logEvent("deferredPrompt já existe na janela")
      setDeferredPrompt(window.deferredPrompt)
      setDebugInfo((prev) => ({ ...prev, hasBeforeInstallPrompt: true }))
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const triggerInstall = async () => {
    if (deferredPrompt) {
      setInstallEvents((prev) => [...prev, `${new Date().toLocaleTimeString()}: Prompt de instalação acionado`])

      try {
        deferredPrompt.prompt()
        const choiceResult = await deferredPrompt.userChoice
        setInstallEvents((prev) => [
          ...prev,
          `${new Date().toLocaleTimeString()}: Escolha do usuário: ${choiceResult.outcome}`,
        ])

        if (choiceResult.outcome === "accepted") {
          setDeferredPrompt(null)
          window.deferredPrompt = null
        }
      } catch (error) {
        setInstallEvents((prev) => [...prev, `${new Date().toLocaleTimeString()}: Erro ao acionar prompt: ${error}`])
      }
    } else {
      setInstallEvents((prev) => [
        ...prev,
        `${new Date().toLocaleTimeString()}: Tentativa de instalação sem deferredPrompt`,
      ])
      alert("O prompt de instalação não está disponível. Verifique os critérios de instalabilidade.")
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-50 bg-gray-800 text-white p-2 rounded-full opacity-70 hover:opacity-100"
        aria-label="Debug PWA"
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
          <path d="M12 16v.01"></path>
          <path d="M12 8v4"></path>
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-4 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white dark:bg-gray-800 pb-2 border-b">
          <h2 className="text-lg font-bold">PWA Debug Avançado</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setInstallEvents([])
                window.location.reload()
              }}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Recarregar página"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Informações básicas */}
          <div className="space-y-2 text-sm">
            <h3 className="font-bold text-md border-b pb-1">Informações Básicas</h3>
            {Object.entries(debugInfo)
              .filter(([key]) => typeof debugInfo[key] !== "object")
              .map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                  <span className="font-medium">{key}:</span>
                  <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
                </div>
              ))}
          </div>

          {/* Critérios de instalabilidade */}
          <div className="space-y-2 text-sm">
            <h3 className="font-bold text-md border-b pb-1">Critérios de Instalabilidade</h3>
            {Object.entries(criteria).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                <span className="font-medium">{key}:</span>
                <span className={value ? "text-green-600" : "text-red-600"}>
                  {value ? <CheckCircle size={16} /> : <AlertTriangle size={16} />} {String(value)}
                </span>
              </div>
            ))}
          </div>

          {/* Detalhes do manifesto */}
          {debugInfo.manifest && (
            <div className="space-y-2 text-sm">
              <h3 className="font-bold text-md border-b pb-1">Detalhes do Manifesto</h3>
              {Object.entries(debugInfo.manifest).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                  <span className="font-medium">{key}:</span>
                  <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Detalhes do Service Worker */}
          {debugInfo.serviceWorkerDetails && (
            <div className="space-y-2 text-sm">
              <h3 className="font-bold text-md border-b pb-1">Detalhes do Service Worker</h3>
              {Object.entries(debugInfo.serviceWorkerDetails).map(([key, value]) => (
                <div key={key} className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-1">
                  <span className="font-medium">{key}:</span>
                  <span className="text-gray-600 dark:text-gray-400">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Log de eventos */}
        <div className="mt-4">
          <h3 className="font-bold text-md border-b pb-1">Log de Eventos</h3>
          <div className="mt-2 bg-gray-100 dark:bg-gray-900 p-2 rounded-md text-xs font-mono h-40 overflow-y-auto">
            {installEvents.length > 0 ? (
              installEvents.map((event, index) => (
                <div key={index} className="border-b border-gray-200 dark:border-gray-700 py-1">
                  {event}
                </div>
              ))
            ) : (
              <div className="text-gray-500">Nenhum evento registrado</div>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
          <button
            onClick={triggerInstall}
            className={`py-2 ${deferredPrompt ? "bg-green-600 hover:bg-green-700" : "bg-gray-400"} text-white rounded-md`}
            disabled={!deferredPrompt}
          >
            Forçar Instalação
          </button>

          <button
            onClick={() => {
              if ("serviceWorker" in navigator) {
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  for (const registration of registrations) {
                    registration.unregister()
                  }
                  setInstallEvents((prev) => [...prev, `${new Date().toLocaleTimeString()}: Service Workers removidos`])
                })
              }
            }}
            className="py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Remover Service Workers
          </button>

          <button
            onClick={() => {
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
                  setInstallEvents((prev) => [...prev, `${new Date().toLocaleTimeString()}: Cache limpo`])
                })
            }}
            className="py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
          >
            Limpar Cache
          </button>

          <button
            onClick={() => window.location.reload()}
            className="py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Recarregar Página
          </button>
        </div>

        {/* Instruções manuais */}
        <div className="mt-4 border-t pt-2">
          <h3 className="font-bold text-md pb-1">Instalação Manual</h3>
          <div className="text-sm space-y-2">
            <p className="font-medium">Para Chrome/Android:</p>
            <ol className="list-decimal pl-5">
              <li>Toque no menu (três pontos) no canto superior direito</li>
              <li>Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"</li>
            </ol>

            <p className="font-medium mt-2">Para Safari/iOS:</p>
            <ol className="list-decimal pl-5">
              <li>Toque no botão de compartilhar (retângulo com seta)</li>
              <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
