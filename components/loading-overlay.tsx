"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface LoadingOverlayProps {
  show: boolean
  message?: string
  fullScreen?: boolean
  delay?: number
  className?: string
}

export function LoadingOverlay({
  show,
  message = "Carregando dados...",
  fullScreen = true,
  delay = 300,
  className = "",
}: LoadingOverlayProps) {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)

  // Efeito para marcar quando o componente está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Efeito para controlar a visibilidade com um pequeno delay
  // para evitar flashes de loading em carregamentos rápidos
  useEffect(() => {
    if (!mounted) return

    let timer: NodeJS.Timeout

    if (show) {
      // Pequeno delay antes de mostrar o loading para evitar flashes
      timer = setTimeout(() => {
        setVisible(true)
      }, delay)
    } else {
      setVisible(false)
    }

    return () => {
      clearTimeout(timer)
    }
  }, [show, mounted, delay])

  if (!mounted || !visible) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`
       flex items-center justify-center bg-background/70 backdrop-blur-sm 
       transition-opacity duration-300 ease-in-out
       ${fullScreen ? "fixed inset-0 z-[100]" : "absolute inset-0 z-[40]"}
       ${className}
     `}
      role="alert"
      aria-live="assertive"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-4"
      >
        <div className="h-24 w-24 relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-full w-full text-primary"
            aria-hidden="true"
          >
            {/* Linha horizontal (base) */}
            <line x1="3" y1="20" x2="21" y2="20"></line>

            {/* Barras animadas com estilos inline */}
            <line
              x1="6"
              y1="20"
              x2="6"
              y2="14"
              style={{
                transformOrigin: "bottom",
                animation: "growBar 1.5s ease-in-out infinite",
                animationDelay: "0s",
              }}
            ></line>

            <line
              x1="12"
              y1="20"
              x2="12"
              y2="4"
              style={{
                transformOrigin: "bottom",
                animation: "growBar 1.5s ease-in-out infinite",
                animationDelay: "0.2s",
              }}
            ></line>

            <line
              x1="18"
              y1="20"
              x2="18"
              y2="10"
              style={{
                transformOrigin: "bottom",
                animation: "growBar 1.5s ease-in-out infinite",
                animationDelay: "0.4s",
              }}
            ></line>
          </svg>
        </div>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-lg font-medium"
        >
          {message}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
