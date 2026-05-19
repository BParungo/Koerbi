import { ref, onBeforeUnmount } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'

export function useBarcodeScanner() {
  const isSupported = ref(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  const scanning = ref(false)
  const error = ref<string | null>(null)
  const lastEan = ref<string | null>(null)

  let scanner: Html5Qrcode | null = null

  async function waitForElement(elementId: string, timeoutMs = 2000): Promise<HTMLElement> {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
      const el = document.getElementById(elementId)
      if (el && el.isConnected) return el
      await new Promise((r) => requestAnimationFrame(() => r(null)))
    }
    throw new Error(`Scanner-Container "${elementId}" nicht gefunden`)
  }

  async function start(elementId: string, onDetected: (ean: string) => void) {
    if (!isSupported.value) {
      error.value = 'Kamera nicht verfügbar'
      return
    }
    if (scanning.value) return

    error.value = null
    try {
      // Wait for the target element to exist before constructing Html5Qrcode —
      // after v-if remounts, the DOM may not be ready in the same tick.
      await waitForElement(elementId)
      scanner = new Html5Qrcode(elementId)
      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const side = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.85)
            return { width: side, height: Math.floor(side * 0.6) }
          },
        },
        (decoded) => {
          lastEan.value = decoded
          onDetected(decoded)
        },
        () => {},
      )
      scanning.value = true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kamera konnte nicht gestartet werden'
      error.value = msg
      scanning.value = false
      // Clean up partially initialised scanner so the next start() gets a fresh instance.
      scanner = null
    }
  }

  async function stop() {
    if (!scanner) return
    try {
      if (scanning.value) {
        await scanner.stop()
      }
      scanner.clear()
    } catch {
      // ignore — scanner may already be stopped
    }
    scanner = null
    scanning.value = false
  }

  onBeforeUnmount(() => {
    void stop()
  })

  return { isSupported, scanning, error, lastEan, start, stop }
}
