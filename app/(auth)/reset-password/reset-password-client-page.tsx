"use client"

import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import { ModeToggle } from "@/components/mode-toggle"
import { motion } from "framer-motion"

export default function ResetPasswordClientPage() {
  return (
    <>
      <div className="absolute top-4 right-4 z-20">
        <ModeToggle />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <ResetPasswordForm />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground"
      >
        <p>© {new Date().getFullYear()} FinanceChat. Todos os direitos reservados.</p>
      </motion.div>
    </>
  )
}
