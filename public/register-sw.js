// Verificar se o navegador suporta Service Workers antes de tentar registrar
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registrado com sucesso:", registration.scope)
      })
      .catch((error) => {
        console.log("Falha ao registrar o Service Worker:", error)
      })
  })
}

// Verificar status de conexão
function updateOnlineStatus() {
  const statusIndicator = document.getElementById("connection-status")
  if (statusIndicator) {
    if (navigator.onLine) {
      statusIndicator.textContent = "Online"
      statusIndicator.classList.remove("bg-red-500")
      statusIndicator.classList.add("bg-green-500")

      // Tentar sincronizar dados quando voltar online
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready
          .then((registration) => registration.sync.register("sync-transactions"))
          .catch((err) => {
            console.log("Erro ao registrar sincronização:", err)
          })
      }
    } else {
      statusIndicator.textContent = "Offline"
      statusIndicator.classList.remove("bg-green-500")
      statusIndicator.classList.add("bg-red-500")
    }
  }
}

window.addEventListener("online", updateOnlineStatus)
window.addEventListener("offline", updateOnlineStatus)
window.addEventListener("load", updateOnlineStatus)
