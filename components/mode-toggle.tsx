"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Necessário para evitar erro de hidratação
  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  // Renderizar um placeholder vazio durante a hidratação
  if (!mounted) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Switch
        checked={theme === "dark"}
        onCheckedChange={toggleTheme}
        aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      />
      <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </div>
  )
}
