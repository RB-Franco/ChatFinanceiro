import type { Metadata } from "next"
import ForgotPasswordClientPage from "./ForgotPasswordClientPage"

export const metadata: Metadata = {
  title: "Recuperar Senha | FinanceChat",
  description: "Recupere sua senha do FinanceChat",
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordClientPage />
}
