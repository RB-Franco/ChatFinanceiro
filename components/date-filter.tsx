"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"

interface DateFilterProps {
  onFilterChange: (month: number, year: number) => void
  showFamilyToggle?: boolean
  showFamilyTransactions?: boolean
  onFamilyToggleChange?: () => void
}

// Componente melhorado de filtro de data
export function DateFilter({
  onFilterChange,
  showFamilyToggle = false,
  showFamilyTransactions = false,
  onFamilyToggleChange,
}: DateFilterProps) {
  const currentDate = new Date()
  const [month, setMonth] = useState(currentDate.getMonth())
  const [year, setYear] = useState(currentDate.getFullYear())

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i)

  const handlePreviousMonth = () => {
    let newMonth = month - 1
    let newYear = year

    if (newMonth < 0) {
      newMonth = 11
      newYear = year - 1
    }

    setMonth(newMonth)
    setYear(newYear)
    onFilterChange(newMonth, newYear)
  }

  const handleNextMonth = () => {
    let newMonth = month + 1
    let newYear = year

    if (newMonth > 11) {
      newMonth = 0
      newYear = year + 1
    }

    setMonth(newMonth)
    setYear(newYear)
    onFilterChange(newMonth, newYear)
  }

  const handleMonthChange = (value: string) => {
    const newMonth = Number.parseInt(value)
    setMonth(newMonth)
    onFilterChange(newMonth, year)
  }

  const handleYearChange = (value: string) => {
    const newYear = Number.parseInt(value)
    setYear(newYear)
    onFilterChange(month, newYear)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center"
    >
      <div className="bg-background border rounded-lg shadow-sm flex items-center p-2 relative overflow-hidden h-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50 pointer-events-none"></div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handlePreviousMonth}
          aria-label="Mês anterior"
          className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center px-1 relative">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4 text-primary mr-1 flex-shrink-0" />

            <Select value={month.toString()} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[130px] h-6 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 font-medium">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {monthNames.map((name, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={year.toString()} onValueChange={handleYearChange}>
              <SelectTrigger className="w-[90px] h-6 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 font-medium">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          aria-label="Próximo mês"
          className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {showFamilyToggle && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2 ml-3 bg-background border rounded-lg p-1.5 shadow-sm h-10">
                <label htmlFor="family-toggle" className="text-sm font-medium cursor-pointer flex items-center">
                  <Users className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  <span>Transações familiares</span>
                </label>
                <Switch
                  id="family-toggle"
                  checked={showFamilyTransactions}
                  onCheckedChange={onFamilyToggleChange}
                  aria-label="Mostrar apenas transações familiares"
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">
                {showFamilyTransactions
                  ? "Mostrando apenas transações familiares compartilhadas"
                  : "Mostrando apenas suas transações pessoais"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </motion.div>
  )
}
