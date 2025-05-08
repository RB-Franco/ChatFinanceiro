"use client"

import { useState } from "react"
import { X } from "lucide-react"

export function IOSInstallGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  // Verificar se é iOS apenas no cliente
  useState(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(iOS)
  })

  if (!isIOS) return null

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Como instalar no iOS</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="font-bold">1</span>
                </div>
                <p>Toque no ícone de compartilhamento</p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="font-bold">2</span>
                </div>
                <p>Role para baixo e toque em "Adicionar à Tela de Início"</p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="font-bold">3</span>
                </div>
                <p>Toque em "Adicionar" no canto superior direito</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="mt-6 w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-blue-600 text-white p-3 rounded-full shadow-lg"
        aria-label="Como instalar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>
      </button>
    </>
  )
}
