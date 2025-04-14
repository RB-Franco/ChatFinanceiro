import { redirect } from "next/navigation"

// This is a Server Component
export default function Home() {
  // This is a server-side redirect that happens during rendering
  redirect("/dashboard")

  // This line is unreachable but needed for TypeScript
  return null
}
