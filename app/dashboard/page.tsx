"use client"

import { useState, useCallback, useEffect } from "react"
import { MainSidebar } from "@/components/main-sidebar"
import { FinanceChat } from "@/components/finance-chat"
import { SidebarInset } from "@/components/ui/sidebar"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { ExpenseChart } from "@/components/dashboard/expense-chart"
import { ExpensePieChart } from "@/components/dashboard/expense-pie-chart"
import { RecentTransactions } from "@/components/dashboard/recent-transactions"
import { DateFilter } from "@/components/date-filter"
import { useFinance } from "@/components/finance-provider"
import { LoadingOverlay } from "@/components/loading-overlay"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ChatSidebarProvider } from "@/components/finance-chat"
import { RouteTransition } from "@/components/route-transition"
import { PageTransition } from "@/components/page-transition"
import { BarChart3, Calendar, Users } from "lucide-react"
import { HeaderContainer, FeatureToggle } from "@/components/ui/header-container"

export default function DashboardPage() {
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [includeFuture, setIncludeFuture] = useState(true)
  const {
    loading: financeLoading,
    isProcessingTransaction,
    showFamilyTransactions,
    toggleFamilyTransactions,
    hasFamilyCode,
  } = useFinance()
  const [pageLoading, setPageLoading] = useState(true)

  // Efeito para controlar o loading da página
  useEffect(() => {
    // Se os dados financeiros estiverem carregados, podemos mostrar a página
    if (!financeLoading) {
      // Pequeno delay para garantir que todos os componentes estejam prontos
      const timer = setTimeout(() => {
        setPageLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    } else {
      // Se os dados financeiros estiverem carregando, garantir que a página também esteja em loading
      setPageLoading(true)
    }
  }, [financeLoading])

  const handleFilterChange = useCallback((newMonth: number, newYear: number) => {
    setMonth(newMonth)
    setYear(newYear)
  }, [])

  // Mostrar o loading overlay quando a página estiver carregando ou quando as transações estiverem sendo carregadas
  const showLoading = pageLoading || financeLoading

  return (
    <div className="flex min-h-screen h-screen w-full overflow-hidden">
      <SidebarProvider>
        <MainSidebar />
        <ChatSidebarProvider>
          <div className="flex flex-1 overflow-hidden relative">
            <SidebarInset className="flex-1 overflow-hidden w-full">
              <div className="h-full w-full overflow-auto dashboard-gradient relative">
                <RouteTransition />
                {showLoading && (
                  <LoadingOverlay
                    show={showLoading}
                    fullScreen={false}
                    className="content-loading-overlay"
                    message="Carregando transações..."
                  />
                )}
                <PageTransition className="h-full w-full flex flex-col">
                  <div className="dashboard-container dashboard-spacing py-4 md:py-6 w-full max-w-none">
                    <HeaderContainer
                      title="Dashboard"
                      subtitle="Visão geral das suas finanças"
                      icon={<BarChart3 className="h-8 w-8 text-primary" />}
                      actions={
                        <>
                          <DateFilter
                            onFilterChange={handleFilterChange}
                            showFamilyToggle={false}
                            showFamilyTransactions={showFamilyTransactions}
                            onFamilyToggleChange={toggleFamilyTransactions}
                          />

                          <div className="flex items-center gap-2 bg-background border rounded-lg p-2 shadow-sm">
                            <FeatureToggle
                              id="include-future"
                              checked={includeFuture}
                              onChange={() => setIncludeFuture(!includeFuture)}
                              icon={<Calendar className="h-5 w-5" />}
                              tooltipText="Incluir transações futuras"
                            />

                            {hasFamilyCode && (
                              <FeatureToggle
                                id="family-toggle"
                                checked={showFamilyTransactions}
                                onChange={toggleFamilyTransactions}
                                icon={<Users className="h-5 w-5" />}
                                tooltipText="Mostrar transações familiares"
                              />
                            )}
                          </div>
                        </>
                      }
                    />

                    <div className="dashboard-transition fade-in">
                      <SummaryCards month={month} year={year} includeFuture={includeFuture} />
                    </div>

                    <div className="dashboard-grid dashboard-grid-cols-2 dashboard-transition fade-in">
                      <ExpensePieChart month={month} year={year} includeFuture={includeFuture} />
                      <ExpenseChart month={month} year={year} includeFuture={includeFuture} />
                    </div>

                    <div className="dashboard-transition fade-in">
                      <RecentTransactions month={month} year={year} includeFuture={includeFuture} />
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
