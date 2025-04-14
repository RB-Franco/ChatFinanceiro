"use client"

import type React from "react"

import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface HeaderContainerProps {
  title: string
  subtitle?: string
  icon: ReactNode
  actions?: ReactNode
  className?: string
}

export function HeaderContainer({ title, subtitle, icon, actions, className }: HeaderContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-4 w-full mb-6 dashboard-transition",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-xl shadow-sm border border-primary/5">{icon}</div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
        </div>
      </div>

      {actions && <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">{actions}</div>}
    </motion.div>
  )
}

export function FeatureToggle({
  checked,
  onChange,
  icon,
  tooltipText,
  id,
}: {
  checked: boolean
  onChange: () => void
  icon: ReactNode
  tooltipText: string
  id: string
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [isMounted, setIsMounted] = useState(false)

  // Determinar a cor com base no ID do toggle
  let colorClass = "green"
  if (id.includes("future")) {
    colorClass = "amber"
  } else if (id.includes("family")) {
    colorClass = "blue"
  }

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      top: rect.bottom + 10,
      left: rect.left + rect.width / 2,
    })
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  return (
    <>
      <button
        id={id}
        onClick={onChange}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full transition-all",
          "border shadow-sm hover:shadow-md",
          checked
            ? "bg-primary text-primary-foreground border-primary/50"
            : "bg-background text-muted-foreground border-border hover:text-foreground",
        )}
        aria-checked={checked}
        role="switch"
        type="button"
      >
        {icon}
      </button>

      {/* Renderizar o tooltip usando portal para evitar problemas de z-index */}
      {isMounted &&
        showTooltip &&
        document.body &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: `${tooltipPosition.top}px`,
              left: `${tooltipPosition.left}px`,
              transform: "translateX(-50%)",
              zIndex: 99999,
              pointerEvents: "none",
            }}
          >
            <div
              className={`bg-${colorClass}-50 border border-${colorClass}-200 shadow-lg rounded-md p-4 w-64 relative dark:bg-gray-900 dark:border-gray-800 dark:text-white`}
            >
              {/* Seta apontando para cima */}
              <div
                className={`absolute top-[-6px] left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 bg-${colorClass}-50 dark:bg-${colorClass}-900/20 border-t border-l border-${colorClass}-200 dark:border-${colorClass}-800/30`}
              ></div>

              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 p-2 rounded-full bg-${colorClass}-100 dark:bg-${colorClass}-800/30 text-${colorClass}-600 dark:text-${colorClass}-300`}
                >
                  {icon}
                </div>

                <div className="space-y-2 flex-1">
                  <p className={`font-semibold text-${colorClass}-700 dark:text-${colorClass}-300`}>{tooltipText}</p>
                  <div
                    className={`flex items-center gap-1.5 mt-1 mb-2 ${checked ? `text-${colorClass}-600 dark:text-${colorClass}-400` : "text-muted-foreground"}`}
                  >
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${checked ? `bg-${colorClass}-500` : "bg-muted-foreground"}`}
                    ></span>
                    <p className="font-medium text-sm">{checked ? "Ativado" : "Desativado"}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {id.includes("future")
                      ? checked
                        ? "Incluindo transações futuras"
                        : "Apenas transações realizadas"
                      : id.includes("family")
                        ? checked
                          ? "Mostrando transações familiares"
                          : "Apenas transações pessoais"
                        : checked
                          ? "Funcionalidade ativada"
                          : "Funcionalidade desativada"}
                  </p>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
