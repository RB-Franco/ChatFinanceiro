import type { ButtonHTMLAttributes, ReactNode } from "react"

interface MinimalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  className?: string
}

export function MinimalButton({ children, className = "", ...props }: MinimalButtonProps) {
  return (
    <button
      className={`
       flex items-center justify-center px-6 py-3 rounded-md
       bg-teal-500 hover:bg-teal-600 text-white font-medium
       dark:bg-teal-600 dark:hover:bg-teal-700
       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
       ${className}
     `}
      {...props}
    >
      {children}
    </button>
  )
}
