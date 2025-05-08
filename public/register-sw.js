// Registrar o service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registrado com sucesso:", registration.scope)

        // Verificar se há atualizações do service worker
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Há uma nova versão disponível
              if (confirm("Nova versão disponível! Deseja atualizar agora?")) {
                window.location.reload()
              }
            }
          })
        })
      })
      .catch((error) => {
        console.log("Falha ao registrar o Service Worker:", error)
      })

    // Verificar se o app está sendo executado em modo standalone (PWA instalado)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      console.log("Aplicativo sendo executado como PWA")
      document.body.classList.add("pwa-mode")
    }

    // Lidar com eventos de online/offline
    window.addEventListener("online", () => {
      console.log("Aplicativo online")
      document.body.classList.remove("offline")

      // Tentar sincronizar dados pendentes
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register("sync-transactions")
        })
      }
    })

    window.addEventListener("offline", () => {
      console.log("Aplicativo offline")
      document.body.classList.add("offline")
    })
  })
}

// Função para solicitar permissão de notificação
function requestNotificationPermission() {
  if ("Notification" in window) {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        console.log("Permissão de notificação concedida")

        // Registrar para receber notificações push
        subscribeToPushNotifications()
      }
    })
  }
}

// Função para assinar notificações push
async function subscribeToPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready

    // Verificar se já está inscrito
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      return subscription
    }

    // Criar nova inscrição
    const newSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U",
      ),
    })

    // Enviar a inscrição para o servidor
    await fetch("/api/push-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newSubscription),
    })

    return newSubscription
  } catch (error) {
    console.error("Erro ao assinar notificações push:", error)
  }
}

// Função auxiliar para converter chave base64 para Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

// Variável global para armazenar o evento beforeinstallprompt
window.deferredPrompt = null

// Capturar o evento beforeinstallprompt
window.addEventListener("beforeinstallprompt", (e) => {
  // Prevenir o comportamento padrão
  e.preventDefault()

  // Armazenar o evento para uso posterior
  window.deferredPrompt = e

  console.log("App pode ser instalado - evento capturado")

  // Mostrar o botão de instalação
  const installButton = document.getElementById("pwa-install-button")
  if (installButton) {
    installButton.style.display = "block"
  }
})

// Verificar se já está instalado
window.addEventListener("appinstalled", (e) => {
  console.log("Aplicativo instalado com sucesso")
  window.deferredPrompt = null

  // Esconder o botão de instalação
  const installButton = document.getElementById("pwa-install-button")
  if (installButton) {
    installButton.style.display = "none"
  }
})

// Detectar quando o app é instalado
window.addEventListener("appinstalled", (e) => {
  console.log("Aplicativo instalado")

  // Esconder o botão de instalação
  const installButtons = document.querySelectorAll(".install-pwa-button")
  installButtons.forEach((button) => {
    button.style.display = "none"
  })

  // Atualizar a UI para refletir o estado instalado
  document.body.classList.add("app-installed")
})
