// Este script verifica se o aplicativo pode ser instalado como PWA
;(() => {
  // Verificar se o navegador suporta PWA
  const isPWASupported = "serviceWorker" in navigator && "PushManager" in window && "caches" in window

  // Verificar se está sendo executado como PWA
  const isRunningAsPWA = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true

  // Verificar se está em HTTPS
  const isHttps = window.location.protocol === "https:"

  // Verificar se o manifesto está presente
  const hasManifest = !!document.querySelector('link[rel="manifest"]')

  // Verificar se tem ícones
  const hasIcons =
    !!document.querySelector('link[rel="icon"]') && !!document.querySelector('link[rel="apple-touch-icon"]')

  // Verificar se o service worker está registrado
  async function checkServiceWorker() {
    if (!("serviceWorker" in navigator)) return false

    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      return registrations.length > 0
    } catch (e) {
      return false
    }
  }

  // Verificar todos os requisitos
  async function checkInstallability() {
    const hasServiceWorker = await checkServiceWorker()

    const requirements = {
      isPWASupported,
      isHttps,
      hasManifest,
      hasIcons,
      hasServiceWorker,
      isRunningAsPWA,
    }

    const canBeInstalled = isPWASupported && isHttps && hasManifest && hasIcons && hasServiceWorker && !isRunningAsPWA

    console.log("[PWA-Check] Requisitos de instalação:", requirements)
    console.log("[PWA-Check] Pode ser instalado:", canBeInstalled)

    return { requirements, canBeInstalled }
  }

  // Executar a verificação
  checkInstallability().then((result) => {
    // Armazenar o resultado para uso posterior
    window.pwaCheckResult = result

    // Disparar um evento personalizado
    window.dispatchEvent(new CustomEvent("pwaCheckComplete", { detail: result }))
  })
})()
