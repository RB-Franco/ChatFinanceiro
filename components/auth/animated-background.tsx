"use client"

import type React from "react"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface AnimatedBackgroundProps {
  children: React.ReactNode
}

export function AnimatedBackground({ children }: AnimatedBackgroundProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Determinar cores baseadas no tema
  const arrowColor = mounted && theme === "dark" ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)"

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Container para as setas animadas */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Gerar múltiplas setas em posições aleatórias */}
        {Array.from({ length: 20 }).map((_, index) => (
          <div
            key={index}
            className="absolute animate-float-up"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-50px`,
              opacity: 0.3 + Math.random() * 0.4,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${15 + Math.random() * 15}s`,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                transform: "rotate(-45deg)",
                fill: arrowColor,
              }}
            >
              <path
                d="M12 5L12 19M12 5L5 12M12 5L19 12"
                stroke={arrowColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ))}
      </div>

      {/* Conteúdo principal (formulários) */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}
