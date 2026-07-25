import { createApp } from 'vue'
import App from './App.vue'
import './assets/styles.css'
import { registerSW } from 'virtual:pwa-register'

const app = createApp(App)
app.mount('#app')

/**
 * Enregistrement du Service Worker PWA avec rechargement automatique
 * lorsqu'une nouvelle version de l'application est déployée.
 */
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Une nouvelle version est disponible : déclenche l'activation et le rechargement
    console.log('🔄 Nouvelle version détectée. Rechargement automatique...')
    updateSW(true)
  },
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      // Vérification périodique des mises à jour (toutes les 15 minutes)
      setInterval(async () => {
        if (registration.installing || !navigator.onLine) return
        await registration.update()
      }, 15 * 60 * 1000)
    }
  },
  onOfflineReady() {
    console.log('✅ Application prête pour le fonctionnement hors-ligne.')
  }
})

// Recontrôle les mises à jour lorsque l'application revient au premier plan
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    updateSW()
  }
})
