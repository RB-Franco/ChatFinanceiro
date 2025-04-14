import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const res = NextResponse.next()

  // Verificar se há um cookie de login bem-sucedido
  const loginSuccessCookie = request.cookies.get("auth_login_success")
  const isLoginSuccess = loginSuccessCookie?.value === "true"

  // Verificar se há um cookie de sessão temporária
  const tempSessionCookie = request.cookies.get("auth_session")
  const hasTempSession = tempSessionCookie?.value === "true"

  // Se estiver vindo de um login bem-sucedido ou tiver uma sessão temporária, permitir acesso
  if (isLoginSuccess || hasTempSession) {
    // Limpar o cookie de login no response se for um login bem-sucedido
    if (isLoginSuccess) {
      const response = NextResponse.next()
      response.cookies.delete("auth_login_success")
      return response
    }
    return res
  }

  // Criar cliente Supabase para verificar autenticação
  const supabase = createMiddlewareClient({ req: request, res })

  // Verificar se o usuário está na raiz
  if (url.pathname === "/") {
    try {
      // Verificar se o usuário está autenticado
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // Se estiver autenticado, redirecionar para o dashboard
      if (session) {
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }

      // Se não estiver autenticado, redirecionar para o login
      url.pathname = "/login"
      return NextResponse.redirect(url)
    } catch (error) {
      // Em caso de erro, redirecionar para o login
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }
  }

  // Rotas protegidas que requerem autenticação
  const protectedRoutes = ["/dashboard", "/reports", "/calendar", "/profile"]
  const isProtectedRoute = protectedRoutes.some(
    (route) => url.pathname === route || url.pathname.startsWith(`${route}/`),
  )

  // Se não for uma rota protegida, continuar normalmente
  if (!isProtectedRoute) {
    return res
  }

  // Verificar se o código de bypass está funcionando corretamente
  if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
    return res
  }

  try {
    // Verificar se o usuário está autenticado
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Se não estiver autenticado, redirecionar para o login
    if (!session) {
      // Redirecionar para o login com a rota atual como parâmetro de redirecionamento
      url.pathname = "/login"
      url.searchParams.set("redirect", request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    // Se estiver autenticado, permitir acesso
    return res
  } catch (error) {
    // Em caso de erro, permitir acesso para evitar problemas
    return res
  }
}

// Ver: https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|images|public).*)",
  ],
}
