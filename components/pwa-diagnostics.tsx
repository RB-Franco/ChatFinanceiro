"use client"

import { useEffect, useState } from "react"

export function PWADiagnostics() {
  const [diagnostics, setDiagnostics] = useState<{
    https: boolean
    manifestLoaded: boolean
    serviceWorkerRegistered: boolean
    installable: boolean
    standalone: boolean
    manifestDetails: any
    serviceWorkerDetails: any
    errors: string[]
  }>({
    https: false,
    manifestLoaded: false,
    serviceWorkerRegistered: false,
    installable: false,
    standalone: false,
    manifestDetails: null,
    serviceWorkerDetails: null,
    errors: [],
  })

  useEffect(() => {
    const runDiagnostics = async () => {
      const errors: string[] = []
      let manifestDetails = null
      let serviceWorkerDetails = null

      // Verificar HTTPS
      const isHttps = window.location.protocol === "https:"
      if (!isHttps) {
        errors.push("A aplicação não está sendo servida via HTTPS, o que é necessário para PWAs.")
      }

      // Verificar manifesto
      let manifestLoaded = false
      try {
        const manifestLinks = document.querySelectorAll('link[rel="manifest"]')
        if (manifestLinks.length === 0) {
          errors.push("Nenhum link para o manifesto encontrado no documento.")
        } else {
          const manifestLink = manifestLinks[0].getAttribute("href")
          if (manifestLink) {
            const manifestResponse = await fetch(manifestLink)
            if (manifestResponse.ok) {
              manifestDetails = await manifestResponse.json()
              manifestLoaded = true

              // Verificar ícones
              if (!manifestDetails.icons || manifestDetails.icons.length === 0) {
                errors.push("O manifesto não contém ícones.")
              } else {
                const has192 = manifestDetails.icons.some(
                  (icon: any) => icon.sizes === "192x192" || icon.sizes.includes("192x192"),
                )
                const has512 = manifestDetails.icons.some(
                  (icon: any) => icon.sizes === "512x512" || icon.sizes.includes("512x512"),
                )

                if (!has192) {
                  errors.push("Falta ícone de 192x192 no manifesto.")
                }
                if (!has512) {
                  errors.push("Falta ícone de 512x512 no manifesto.")
                }

                // Verificar acessibilidade dos ícones
                for (const icon of manifestDetails.icons) {
                  try {
                    const iconResponse = await fetch(icon.src)
                    if (!iconResponse.ok) {
                      errors.push(`Ícone ${icon.src} não está acessível (${iconResponse.status}).`)
                    }
                  } catch (error) {
                    errors.push(`Erro ao acessar ícone ${icon.src}: ${error}`)
                  }
                }
              }

              // Verificar outras propriedades obrigatórias
              if (!manifestDetails.name && !manifestDetails.short_name) {
                errors.push("O manifesto não contém name ou short_name.")
              }
              if (!manifestDetails.start_url) {
                errors.push("O manifesto não contém start_url.")
              }
              if (!manifestDetails.display) {
                errors.push("O manifesto não contém display.")
              } else if (!["standalone", "fullscreen", "minimal-ui"].includes(manifestDetails.display)) {
                errors.push(`O valor de display (${manifestDetails.display}) não é válido para instalação.`)
              }
            } else {
              errors.push(`Falha ao carregar o manifesto: ${manifestResponse.status} ${manifestResponse.statusText}`)
            }
          } else {
            errors.push("Link para o manifesto encontrado, mas sem atributo href.")
          }
        }
      } catch (error) {
        errors.push(`Erro ao verificar o manifesto: ${error}`)
      }

      // Verificar Service Worker
      let serviceWorkerRegistered = false
      try {
        if ("serviceWorker" in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations()
          serviceWorkerRegistered = registrations.length > 0

          if (registrations.length > 0) {
            serviceWorkerDetails = {
              count: registrations.length,
              scopes: registrations.map((reg) => reg.scope),
              active: registrations.some((reg) => !!reg.active),
              waiting: registrations.some((reg) => !!reg.waiting),
              installing: registrations.some((reg) => !!reg.installing),
            }
          } else {
            errors.push("Nenhum Service Worker registrado.")
          }
        } else {
          errors.push("Service Worker não é suportado neste navegador.")
        }
      } catch (error) {
        errors.push(`Erro ao verificar o Service Worker: ${error}`)
      }

      // Verificar se está em modo standalone
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true

      // Verificar se é instalável
      let isInstallable = false
      try {
        // Não podemos verificar diretamente, mas podemos verificar se o evento beforeinstallprompt foi capturado
        isInstallable =
          !!window.deferredPrompt || (isHttps && manifestLoaded && serviceWorkerRegistered && !isStandalone)
      } catch (error) {
        errors.push(`Erro ao verificar instalabilidade: ${error}`)
      }

      setDiagnostics({
        https: isHttps,
        manifestLoaded,
        serviceWorkerRegistered,
        installable: isInstallable,
        standalone: isStandalone,
        manifestDetails,
        serviceWorkerDetails,
        errors,
      })
    }

    runDiagnostics()
  }, [])

  if (process.env.NODE_ENV === "production") {
    return null // Não mostrar em produção
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700 z-50 text-sm overflow-auto max-h-[50vh]">
      <h2 className="text-lg font-bold mb-2">Diagnóstico PWA</h2>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="flex items-center">
          <span className={`w-3 h-3 rounded-full mr-2 ${diagnostics.https ? "bg-green-500" : "bg-red-500"}`}></span>
          <span>HTTPS: {diagnostics.https ? "Sim" : "Não"}</span>
        </div>
        <div className="flex items-center">
          <span
            className={`w-3 h-3 rounded-full mr-2 ${diagnostics.manifestLoaded ? "bg-green-500" : "bg-red-500"}`}
          ></span>
          <span>Manifesto: {diagnostics.manifestLoaded ? "Carregado" : "Não carregado"}</span>
        </div>
        <div className="flex items-center">
          <span
            className={`w-3 h-3 rounded-full mr-2 ${diagnostics.serviceWorkerRegistered ? "bg-green-500" : "bg-red-500"}`}
          ></span>
          <span>Service Worker: {diagnostics.serviceWorkerRegistered ? "Registrado" : "Não registrado"}</span>
        </div>
        <div className="flex items-center">
          <span
            className={`w-3 h-3 rounded-full mr-2 ${diagnostics.installable ? "bg-green-500" : "bg-red-500"}`}
          ></span>
          <span>Instalável: {diagnostics.installable ? "Sim" : "Não"}</span>
        </div>
        <div className="flex items-center">
          <span
            className={`w-3 h-3 rounded-full mr-2 ${diagnostics.standalone ? "bg-green-500" : "bg-red-500"}`}
          ></span>
          <span>Modo Standalone: {diagnostics.standalone ? "Sim" : "Não"}</span>
        </div>
      </div>

      {diagnostics.errors.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-red-500">Erros ({diagnostics.errors.length}):</h3>
          <ul className="list-disc pl-5">
            {diagnostics.errors.map((error, index) => (
              <li key={index} className="text-red-500">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {diagnostics.manifestDetails && (
          <div>
            <h3 className="font-bold">Detalhes do Manifesto:</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto max-h-[200px]">
              {JSON.stringify(diagnostics.manifestDetails, null, 2)}
            </pre>
          </div>
        )}

        {diagnostics.serviceWorkerDetails && (
          <div>
            <h3 className="font-bold">Detalhes do Service Worker:</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs overflow-auto max-h-[200px]">
              {JSON.stringify(diagnostics.serviceWorkerDetails, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
