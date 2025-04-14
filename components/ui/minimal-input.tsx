"use client"

import { useState, useRef, useEffect } from "react"
import type { ChangeEvent, ReactNode } from "react"

interface MinimalInputProps {
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  type?: string
  required?: boolean
  disabled?: boolean
  icon?: ReactNode
  className?: string
}

export function MinimalInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  icon,
  className = "",
}: MinimalInputProps) {
  const [focused, setFocused] = useState(false)
  const [hasValue, setHasValue] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Verificar se o input tem valor
  useEffect(() => {
    setHasValue(value.length > 0)
  }, [value])

  // Determinar se a label deve flutuar
  const shouldFloat = focused || hasValue

  return (
    <div className={`relative group ${className}`}>
      <div className="relative">
        {/* Ícone */}
        {icon && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 text-teal-600 dark:text-teal-400">{icon}</div>
        )}

        {/* Input com padding para acomodar o ícone */}
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
        w-full bg-transparent border-0 border-b border-teal-500/50 dark:border-teal-400/50
        outline-none transition-all duration-200 py-3
        focus:ring-0 focus:ring-offset-0 text-teal-700 dark:text-teal-300
        ${icon ? "pl-8" : "pl-0"}
      `}
          style={{ borderBottomWidth: "1px" }}
        />

        {/* Label posicionada dentro do input */}
        <label
          onClick={() => inputRef.current?.focus()}
          className={`
        absolute text-teal-600 dark:text-teal-400 transition-all duration-200 cursor-text
        ${icon ? "left-8" : "left-0"}
        ${value || focused ? "top-0 text-xs" : "top-1/2 -translate-y-1/2 text-sm"}
      `}
        >
          {label}
        </label>
      </div>
    </div>
  )
}
