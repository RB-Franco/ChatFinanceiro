"use client"

import { RegisterForm } from "@/components/auth/register-form"
import { ModeToggle } from "@/components/mode-toggle"
import { motion } from "framer-motion"

export default function RegisterClientPage() {
  return (
    <>
      <div className="absolute top-4 right-4 z-20">
        <ModeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <RegisterForm />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground"
      >
        <p>© {new Date().getFullYear()} FinanceChat. Todos os direitos reservados.</p>
      </motion.div>
    </>
  )
}
