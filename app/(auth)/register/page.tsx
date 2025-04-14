import type { Metadata } from "next"
import RegisterClientPage from "./register-client-page"

export const metadata: Metadata = {
  title: "Cadastro | FinanceChat",
  description: "Crie sua conta no FinanceChat",
}

export default function RegisterPage() {
  return <RegisterClientPage />
}
