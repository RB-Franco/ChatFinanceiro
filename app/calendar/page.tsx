"use client"

import { useState, useEffect } from "react"
import { MainSidebar } from "@/components/main-sidebar"
import { FinanceChat } from "@/components/finance-chat"
import { SidebarInset } from "@/components/ui/sidebar"
import { FinanceCalendar } from "@/components/calendar/finance-calendar"
import { useFinance } from "@/components/finance-provider"
import { LoadingOverlay } from "@/components/loading-overlay"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ChatSidebarProvider } from "@/components/finance-chat"
import { RouteTransition } from "@/components/route-transition"
import { Calendar, Users } from "lucide-react"
import { HeaderContainer, FeatureToggle } from "@/components/ui/header-container"
import { DateFilter } from "@/components/date-filter"
import { PageTransition } from "@/components/page-transition"

export default function CalendarPage() {
  const {
    loading,
    loading: financeLoading,
    isProcessingTransaction,
    showFamilyTransactions,
    toggleFamilyTransactions,
    hasFamilyCode,
  } = useFinance()
  const [pageLoading, setPageLoading] = useState(true)
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [pageFinanceLoading, setPageFinanceLoading] = useState(loading)

  // Efeito para controlar o loading da página
  useEffect(() => {
    // Se os dados financeiros estiverem carregados, podemos mostrar a página
    if (!financeLoading) {
      // Pequeno delay para garantir que todos os componentes estejam prontos
      const timer = setTimeout(() => {
        setPageLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [financeLoading])

  // Função para lidar com a mudança de data
  const handleFilterChange = (newMonth: number, newYear: number) => {
    setMonth(newMonth)
    setYear(newYear)
  }

  // Só mostrar o loading overlay quando a página estiver carregando inicialmente
  // Não mostrar durante o processamento de transações
  const showLoading = (pageLoading || loading) && !isProcessingTransaction

  return (
    <div className="flex min-h-screen h-screen w-full overflow-hidden">
      <SidebarProvider>
        <MainSidebar />
        <ChatSidebarProvider>
          <div className="flex flex-1 overflow-hidden">
            <SidebarInset className="flex-1 overflow-hidden">
              <div className="h-full w-full overflow-auto calendar-gradient relative">
                <RouteTransition />
                {showLoading && (
                  <LoadingOverlay
                    show={showLoading}
                    fullScreen={false}
                    className="content-loading-overlay"
                    message={isProcessingTransaction ? "Atualizando visualização..." : "Carregando transações..."}
                  />
                )}
                <PageTransition className="h-full w-full flex flex-col">
                  <div className="dashboard-container dashboard-spacing py-4 md:py-6">
                    <HeaderContainer
                      title="Calendário Financeiro"
                      subtitle="Visualize suas transações no calendário"
                      icon={<Calendar className="h-8 w-8 text-primary" />}
                      actions={
                        <div className="flex items-center gap-3">
                          <DateFilter onFilterChange={handleFilterChange} showFamilyToggle={false} />

                          {hasFamilyCode && (
                            <div className="flex items-center gap-2 bg-background border rounded-lg p-2 shadow-sm">
                              <FeatureToggle
                                id="show-family-transactions-calendar"
                                checked={showFamilyTransactions}
                                onChange={toggleFamilyTransactions}
                                icon={<Users className="h-5 w-5" />}
                                tooltipText="Mostrar transações familiares"
                              />
                            </div>
                          )}
                        </div>
                      }
                    />
                    <div className="dashboard-transition fade-in">
                      <FinanceCalendar month={month} year={year} />
                    </div>
                  </div>
                </PageTransition>
              </div>
            </SidebarInset>
            <FinanceChat />
          </div>
        </ChatSidebarProvider>
      </SidebarProvider>
    </div>
  )
}
