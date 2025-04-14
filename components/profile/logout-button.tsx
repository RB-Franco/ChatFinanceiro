"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { LogOut, Loader2 } from "lucide-react"

export function LogoutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    setLoading(true)

    try {
      const { error } = await signOut()

      if (error) throw error

      // Redirecionar para a página de login
      router.push("/login")
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error)
      toast({
        title: "Erro ao fazer logout",
        description: error.message || "Ocorreu um erro ao desconectar da sua conta.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="destructive" onClick={handleLogout} disabled={loading} className="w-full">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saindo...
        </>
      ) : (
        <>
          <LogOut className="mr-2 h-4 w-4" />
          Sair da Conta
        </>
      )}
    </Button>
  )
}
