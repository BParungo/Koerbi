import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSnackbar } from '@/composables/useSnackbar'

describe('useSnackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // Reset zwischen Tests: laufende Snackbar schließen (Singleton-State).
    useSnackbar().dismiss()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('show() setzt die aktuelle Snackbar mit Nachricht', () => {
    const { current, show } = useSnackbar()
    show('Milch abgehakt')
    expect(current.value?.message).toBe('Milch abgehakt')
  })

  it('schließt sich automatisch nach der Default-Dauer', () => {
    const { current, show } = useSnackbar()
    show('Milch abgehakt')
    expect(current.value).not.toBeNull()
    vi.advanceTimersByTime(5000)
    expect(current.value).toBeNull()
  })

  it('respektiert eine benutzerdefinierte Dauer', () => {
    const { current, show } = useSnackbar()
    show('kurz', { duration: 1000 })
    vi.advanceTimersByTime(999)
    expect(current.value).not.toBeNull()
    vi.advanceTimersByTime(1)
    expect(current.value).toBeNull()
  })

  it('eine neue Snackbar ersetzt die vorherige und setzt den Timer zurück', () => {
    const { current, show } = useSnackbar()
    show('erste')
    vi.advanceTimersByTime(4000)
    show('zweite')
    // Nach weiteren 4s wäre die erste weg — die zweite lebt noch.
    vi.advanceTimersByTime(4000)
    expect(current.value?.message).toBe('zweite')
    vi.advanceTimersByTime(1000)
    expect(current.value).toBeNull()
  })

  it('runAction() führt die Action aus und schließt die Snackbar', () => {
    const { current, show, runAction } = useSnackbar()
    const onClick = vi.fn()
    show('abgehakt', { action: { label: 'Rückgängig', onClick } })
    runAction()
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(current.value).toBeNull()
  })

  it('dismiss() schließt ohne die Action auszuführen', () => {
    const { current, show, dismiss } = useSnackbar()
    const onClick = vi.fn()
    show('abgehakt', { action: { label: 'Rückgängig', onClick } })
    dismiss()
    expect(onClick).not.toHaveBeenCalled()
    expect(current.value).toBeNull()
  })
})
