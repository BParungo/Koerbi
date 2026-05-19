import { ref, onBeforeUnmount } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'

export function useBarcodeScanner() {
  const isSupported = ref(typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia)
  const scanning = ref(false)
  const error = ref<string | null>(null)
  const lastEan = ref<string | null>(null)

  let scanner: Html5Qrcode | null = null

  async function start(elementId: string, onDetected: (ean: string) => void) {
    if (!isSupported.value) {
      error.value = 'Kamera nicht verfügbar'
      return
    }
    if (scanning.value) return

    error.value = null
    try {
      scanner = new Html5Qrcode(elementId)
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 160 } },
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
    }
  }

  async function stop() {
    if (!scanner || !scanning.value) return
    try {
      await scanner.stop()
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
