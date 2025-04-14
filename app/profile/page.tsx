"use client"

import { useState, useEffect } from "react"
import { MainSidebar } from "@/components/main-sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { ProfileForm } from "@/components/profile/profile-form"
import { ProfileHeader } from "@/components/profile/profile-header"
import { FamilyCodeSection } from "@/components/profile/family-code-section"
import { FinancialSettings } from "@/components/profile/financial-settings"
import { LoadingOverlay } from "@/components/loading-overlay"
import { SidebarProvider } from "@/components/ui/sidebar"
import { useProfile } from "@/components/profile/profile-provider"
import { useFinance } from "@/components/finance-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Home, DollarSign } from "lucide-react"
import { RouteTransition } from "@/components/route-transition"
import { PageTransition } from "@/components/page-transition"

export default function ProfilePage() {
  const { loading: profileLoading } = useProfile()
  const { isProcessingTransaction } = useFinance()
  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("personal")

  useEffect(() => {
    // Se os dados do perfil estiverem carregados, podemos mostrar a página
    if (!profileLoading) {
      // Pequeno delay para garantir que todos os componentes estejam prontos
      const timer = setTimeout(() => {
        setPageLoading(false)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [profileLoading])

  // Só mostrar o loading overlay quando a página estiver carregando inicialmente
  // Não mostrar durante o processamento de transações
  const showLoading = pageLoading && !isProcessingTransaction

  return (
    <div className="flex min-h-screen h-screen w-full overflow-hidden">
      <SidebarProvider>
        <MainSidebar />
        <SidebarInset className="flex-1 overflow-hidden">
          <div className="h-full w-full overflow-auto profile-gradient relative">
            <RouteTransition />
            {showLoading && (
              <LoadingOverlay
                show={showLoading}
                fullScreen={false}
                className="content-loading-overlay"
                message="Carregando perfil..."
              />
            )}
            <PageTransition className="h-full w-full flex flex-col">
              <div className="dashboard-container dashboard-spacing py-4 md:py-6 max-w-6xl mx-auto">
                <div className="dashboard-transition fade-in mb-6">
                  <ProfileHeader />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="dashboard-transition fade-in">
                  <TabsList className="grid grid-cols-3 mb-6 w-full md:w-auto">
                    <TabsTrigger value="personal" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">Informações Pessoais</span>
                      <span className="sm:hidden">Pessoal</span>
                    </TabsTrigger>
                    <TabsTrigger value="financial" className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="hidden sm:inline">Configurações Financeiras</span>
                      <span className="sm:hidden">Financeiro</span>
                    </TabsTrigger>
                    <TabsTrigger value="family" className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span className="hidden sm:inline">Agregado Familiar</span>
                      <span className="sm:hidden">Família</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="space-y-6 mt-2">
                    <ProfileForm />
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-6 mt-2">
                    <FinancialSettings />
                  </TabsContent>

                  <TabsContent value="family" className="space-y-6 mt-2">
                    <FamilyCodeSection />
                  </TabsContent>
                </Tabs>
              </div>
            </PageTransition>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
