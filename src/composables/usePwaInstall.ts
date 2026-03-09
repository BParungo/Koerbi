import { computed, onMounted, onUnmounted, ref } from 'vue'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function detectIos() {
  const ua = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua)
}

function detectStandalone() {
  const nav = window.navigator as Navigator & { standalone?: boolean }

  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

export function usePwaInstall() {
  const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null)
  const canInstall = ref(false)
  const isInstalled = ref(false)
  const isIos = ref(false)

  const showIosHint = computed(() => isIos.value && !isInstalled.value)

  const onBeforeInstallPrompt = (event: Event) => {
    event.preventDefault()
    deferredPrompt.value = event as BeforeInstallPromptEvent
    canInstall.value = true
  }

  const onInstalled = () => {
    isInstalled.value = true
    canInstall.value = false
    deferredPrompt.value = null
  }

  onMounted(() => {
    isIos.value = detectIos()
    isInstalled.value = detectStandalone()

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onInstalled)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onInstalled)
  })

  async function install() {
    if (!deferredPrompt.value) return false

    await deferredPrompt.value.prompt()
    const choice = await deferredPrompt.value.userChoice

    if (choice.outcome === 'accepted') {
      canInstall.value = false
      deferredPrompt.value = null
      return true
    }

    return false
  }

  return {
    canInstall,
    isInstalled,
    showIosHint,
    install
  }
}
