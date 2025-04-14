import type { Metadata } from "next"
import ResetPasswordClientPage from "./reset-password-client-page"

export const metadata: Metadata = {
  title: "Redefinir Senha | FinanceChat",
  description: "Redefina sua senha do FinanceChat",
}

export default function ResetPasswordPage() {
  return <ResetPasswordClientPage />
}
