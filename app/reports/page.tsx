"use client"

import { useState, useEffect } from "react"
import { MainSidebar } from "@/components/main-sidebar"
import { FinanceChat } from "@/components/finance-chat"
import { SidebarInset } from "@/components/ui/sidebar"
import { DateFilter } from "@/components/date-filter"
import { DailyChart } from "@/components/reports/daily-chart"
import { MonthlyChart } from "@/components/reports/monthly-chart"
import { YearlyChart } from "@/components/reports/yearly-chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useFinance } from "@/components/finance-provider"
import { LoadingOverlay } from "@/components/loading-overlay"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ChatSidebarProvider } from "@/components/finance-chat"
import { BarChart3, LineChart, BarChart4, Calendar, Users } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RouteTransition } from "@/components/route-transition"
import { HeaderContainer, FeatureToggle } from "@/components/ui/header-container"
import { PageTransition } from "@/components/page-transition"

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString())
  const [includeFuture, setIncludeFuture] = useState(true)
  const {
    loading,
    loading: financeLoading,
    isProcessingTransaction,
    showFamilyTransactions,
    toggleFamilyTransactions,
    hasFamilyCode,
  } = useFinance()
  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("daily")
  const [financePageLoading, setFinancePageLoading] = useState(loading)

  useEffect(() => {
    setFinancePageLoading(loading)
  }, [loading])

  // Efeito para controlar o loading da página
  useEffect(() => {
    // Se os dados financeiros estiverem carregados, podemos mostrar a página
    if (!financePageLoading) {
      // Pequeno delay para garantir que todos os componentes estejam prontos
      const timer = setTimeout(() => {
        setPageLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [financePageLoading])

  const handleFilterChange = (newMonth: number, newYear: number) => {
    setMonth(newMonth)
    setYear(newYear)
  }

  const handleYearChange = (value: string) => {
    setSelectedYear(value)
  }

  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - 2 + i).toString())

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
              <div className="h-full w-full overflow-auto reports-gradient relative">
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
                      title="Relatórios Financeiros"
                      subtitle="Análise detalhada da evolução das suas finanças"
                      icon={<BarChart4 className="h-8 w-8 text-primary" />}
                      actions={
                        <div className="flex items-center gap-2 bg-background border rounded-lg p-2 shadow-sm">
                          <FeatureToggle
                            id="include-future-reports"
                            checked={includeFuture}
                            onChange={() => setIncludeFuture(!includeFuture)}
                            icon={<Calendar className="h-5 w-5" />}
                            tooltipText="Incluir transações futuras"
                          />

                          {hasFamilyCode && (
                            <FeatureToggle
                              id="show-family-transactions"
                              checked={showFamilyTransactions}
                              onChange={toggleFamilyTransactions}
                              icon={<Users className="h-5 w-5" />}
                              tooltipText="Mostrar transações familiares"
                            />
                          )}
                        </div>
                      }
                    />

                    <div className="mt-6">
                      <Tabs defaultValue="daily" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                          <TabsList className="grid grid-cols-3 w-full md:w-auto">
                            <TabsTrigger value="daily" className="flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              <span className="hidden sm:inline">Fluxo Diário</span>
                              <span className="sm:hidden">Diário</span>
                            </TabsTrigger>
                            <TabsTrigger value="monthly" className="flex items-center gap-2">
                              <LineChart className="h-4 w-4" />
                              <span className="hidden sm:inline">Evolução Mensal</span>
                              <span className="sm:hidden">Mensal</span>
                            </TabsTrigger>
                            <TabsTrigger value="yearly" className="flex items-center gap-2">
                              <BarChart4 className="h-4 w-4" />
                              <span className="hidden sm:inline">Comparativo Anual</span>
                              <span className="sm:hidden">Anual</span>
                            </TabsTrigger>
                          </TabsList>

                          {activeTab === "daily" && (
                            <div className="flex items-center gap-2">
                              <DateFilter
                                onFilterChange={handleFilterChange}
                                showFamilyToggle={false} // Já temos o toggle acima
                              />
                            </div>
                          )}

                          {activeTab === "monthly" && (
                            <div className="flex items-center gap-2">
                              <Select value={selectedYear} onValueChange={handleYearChange}>
                                <SelectTrigger className="w-[100px]" id="year-select">
                                  <SelectValue placeholder="Ano" />
                                </SelectTrigger>
                                <SelectContent>
                                  {years.map((year) => (
                                    <SelectItem key={year} value={year}>
                                      {year}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>

                        <TabsContent value="daily" className="mt-0 space-y-4">
                          <DailyChart month={month} year={year} includeFuture={includeFuture} />
                        </TabsContent>

                        <TabsContent value="monthly" className="mt-0 space-y-4">
                          <MonthlyChart year={Number.parseInt(selectedYear)} includeFuture={includeFuture} />
                        </TabsContent>

                        <TabsContent value="yearly" className="mt-0 space-y-4">
                          <YearlyChart includeFuture={includeFuture} />
                        </TabsContent>
                      </Tabs>
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
