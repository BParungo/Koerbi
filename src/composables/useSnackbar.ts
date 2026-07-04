import { ref } from 'vue'

export interface SnackbarAction {
  label: string
  onClick: () => void
}

interface SnackbarState {
  id: number
  message: string
  action?: SnackbarAction
}

const DEFAULT_DURATION_MS = 5000

// Modul-Level Singleton — eine App-weite Snackbar. Bewusst außerhalb der
// Funktion, damit alle Aufrufer denselben reaktiven State teilen.
const current = ref<SnackbarState | null>(null)
let counter = 0
let dismissTimer: ReturnType<typeof setTimeout> | null = null

function clearTimer() {
  if (dismissTimer !== null) {
    clearTimeout(dismissTimer)
    dismissTimer = null
  }
}

function dismiss() {
  clearTimer()
  current.value = null
}

function show(
  message: string,
  options: { action?: SnackbarAction; duration?: number } = {},
) {
  clearTimer()
  current.value = { id: ++counter, message, action: options.action }
  const duration = options.duration ?? DEFAULT_DURATION_MS
  dismissTimer = setTimeout(dismiss, duration)
}

/** Ruft die Action der aktuellen Snackbar auf und schließt sie. */
function runAction() {
  const action = current.value?.action
  dismiss()
  action?.onClick()
}

export function useSnackbar() {
  return { current, show, dismiss, runAction }
}
