import type { Metadata } from "next"
import LoginPageClient from "./login-page-client"

export const metadata: Metadata = {
  title: "Login | FinanceChat",
  description: "Entre na sua conta do FinanceChat",
}

export default function LoginPage() {
  return <LoginPageClient />
}
