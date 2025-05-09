"use client"

import { useEffect, useState } from "react"
import { Download, X, ChevronDown, ChevronUp, Info } from "lucide-react"

export function PWAInstallGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    // Detectar iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)

    // Mostrar o guia após um tempo
    const timer = setTimeout(() => {
      // Verificar se o usuário já tentou instalar
      const attempted = localStorage.getItem("pwa-install-attempted")
      if (attempted === "true") {
        setIsOpen(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  if (isInstalled) return null

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg animate-pulse"
        aria-label="Instalar aplicativo"
      >
        <Download size={24} />
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 shadow-lg z-40 animate-slide-up rounded-t-xl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center">
          <Download size={20} className="mr-2" /> Instalar FinanceChat
        </h3>
        <button onClick={() => setIsOpen(false)} className="p-1">
          <X size={20} />
        </button>
      </div>

      <div className="mt-2">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
          Instale o FinanceChat para acesso rápido e melhor experiência offline.
        </p>

        {isIOS ? (
          <div className="space-y-3">
            <h4 className="font-medium">Para instalar no iOS:</h4>
            <ol className="list-decimal pl-5 text-sm space-y-2">
              <li>
                Toque no botão de compartilhar{" "}
                <span className="inline-block px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                    <polyline points="16 6 12 2 8 6"></polyline>
                    <line x1="12" y1="2" x2="12" y2="15"></line>
                  </svg>
                </span>
              </li>
              <li>Role para baixo e toque em "Adicionar à Tela de Início"</li>
              <li>Confirme tocando em "Adicionar"</li>
            </ol>
          </div>
        ) : (
          <div className="space-y-3">
            <h4 className="font-medium">Para instalar no Android:</h4>
            <ol className="list-decimal pl-5 text-sm space-y-2">
              <li>Toque no menu (três pontos ⋮) no canto superior direito</li>
              <li>Selecione "Instalar aplicativo" ou "Adicionar à tela inicial"</li>
              <li>Confirme tocando em "Instalar"</li>
            </ol>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-sm text-blue-600 dark:text-blue-400"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span className="ml-1">{isExpanded ? "Menos detalhes" : "Mais detalhes"}</span>
          </button>

          {isExpanded && (
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-2 border-t pt-2">
              <p className="flex items-start">
                <Info size={14} className="mr-1 mt-0.5" />
                Se a opção de instalação não aparecer, tente recarregar a página ou limpar o cache do navegador.
              </p>
              <p>
                Você também pode tentar acessar o site em uma janela anônima/privada para verificar se a instalação
                funciona.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
