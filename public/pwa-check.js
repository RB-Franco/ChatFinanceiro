// Script para verificar a instalabilidade da PWA
;(() => {
  console.log("[PWA Check] Iniciando verificação de instalabilidade...")

  // Verificar se está sendo executado em um navegador
  if (typeof window === "undefined" || typeof document === "undefined") {
    console.log("[PWA Check] Não está sendo executado em um navegador")
    return
  }

  // Verificar se já está instalado
  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true) {
    console.log("[PWA Check] Aplicativo já está instalado como PWA")
    return
  }

  // Verificar HTTPS
  const isHttps = window.location.protocol === "https:"
  console.log(`[PWA Check] HTTPS: ${isHttps ? "Sim" : "Não"}`)

  // Verificar manifesto
  const manifestLink = document.querySelector('link[rel="manifest"]')
  if (!manifestLink) {
    console.error("[PWA Check] Manifesto não encontrado no documento")
  } else {
    console.log(`[PWA Check] Manifesto encontrado: ${manifestLink.getAttribute("href")}`)

    // Verificar se o manifesto é acessível
    fetch(manifestLink.getAttribute("href"))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log("[PWA Check] Manifesto carregado com sucesso:", data)

        // Verificar propriedades essenciais
        const hasName = data.name || data.short_name
        const hasStartUrl = !!data.start_url
        const hasDisplay = ["standalone", "fullscreen", "minimal-ui"].includes(data.display)
        const hasIcons = Array.isArray(data.icons) && data.icons.length > 0

        console.log(`[PWA Check] Manifesto tem nome: ${hasName ? "Sim" : "Não"}`)
        console.log(`[PWA Check] Manifesto tem start_url: ${hasStartUrl ? "Sim" : "Não"}`)
        console.log(`[PWA Check] Manifesto tem display válido: ${hasDisplay ? "Sim" : "Não"}`)
        console.log(`[PWA Check] Manifesto tem ícones: ${hasIcons ? "Sim" : "Não"}`)

        if (hasIcons) {
          // Verificar ícones específicos
          const has192 = data.icons.some((icon) => icon.sizes === "192x192" || icon.sizes.includes("192x192"))
          const has512 = data.icons.some((icon) => icon.sizes === "512x512" || icon.sizes.includes("512x512"))

          console.log(`[PWA Check] Manifesto tem ícone 192x192: ${has192 ? "Sim" : "Não"}`)
          console.log(`[PWA Check] Manifesto tem ícone 512x512: ${has512 ? "Sim" : "Não"}`)

          // Verificar acessibilidade dos ícones
          data.icons.forEach((icon) => {
            fetch(icon.src)
              .then((response) => {
                console.log(`[PWA Check] Ícone ${icon.src}: ${response.ok ? "Acessível" : "Não acessível"}`)
              })
              .catch((error) => {
                console.error(`[PWA Check] Erro ao acessar ícone ${icon.src}:`, error)
              })
          })
        }
      })
      .catch((error) => {
        console.error("[PWA Check] Erro ao carregar o manifesto:", error)
      })
  }

  // Verificar Service Worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        if (registrations.length > 0) {
          console.log(`[PWA Check] Service Worker registrado: ${registrations.length} registros`)
          registrations.forEach((reg, i) => {
            console.log(
              `[PWA Check] SW ${i + 1}: escopo=${reg.scope}, atualizando=${!!reg.installing}, esperando=${!!reg.waiting}, ativo=${!!reg.active}`,
            )
          })
        } else {
          console.error("[PWA Check] Nenhum Service Worker registrado")
        }
      })
      .catch((error) => {
        console.error("[PWA Check] Erro ao verificar Service Worker:", error)
      })
  } else {
    console.error("[PWA Check] Service Worker não suportado neste navegador")
  }

  // Verificar se o evento beforeinstallprompt foi capturado
  console.log(`[PWA Check] Evento beforeinstallprompt capturado: ${window.deferredPrompt ? "Sim" : "Não"}`)

  // Adicionar listener para o evento beforeinstallprompt
  window.addEventListener("beforeinstallprompt", (e) => {
    console.log("[PWA Check] Evento beforeinstallprompt capturado agora")
  })

  console.log("[PWA Check] Verificação concluída")
})()
