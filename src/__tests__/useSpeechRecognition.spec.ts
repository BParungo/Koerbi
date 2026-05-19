import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useSpeechRecognition } from '@/composables/useSpeechRecognition'

class MockSpeechRecognition {
  lang = ''
  interimResults = false
  continuous = false
  onresult: ((event: Event) => void) | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  start = vi.fn()
  stop = vi.fn()
}

let mockInstance: MockSpeechRecognition

beforeEach(() => {
  mockInstance = new MockSpeechRecognition()
  Object.defineProperty(window, 'SpeechRecognition', {
    value: class {
      get onresult() { return mockInstance.onresult }
      set onresult(fn) { mockInstance.onresult = fn }
      get onend() { return mockInstance.onend }
      set onend(fn) { mockInstance.onend = fn }
      get onerror() { return mockInstance.onerror }
      set onerror(fn) { mockInstance.onerror = fn }
      start = (...args: unknown[]) => mockInstance.start(...args)
      stop = (...args: unknown[]) => mockInstance.stop(...args)
    },
    writable: true,
    configurable: true,
  })
  Object.defineProperty(window, 'webkitSpeechRecognition', {
    value: undefined,
    writable: true,
    configurable: true,
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function makeEvent(
  results: { transcript: string; isFinal: boolean }[],
  resultIndex = 0,
): Event {
  const speechResults = results.map(({ transcript, isFinal }) =>
    Object.assign([{ transcript, confidence: 1 }], { isFinal, length: 1 })
  )
  return {
    resultIndex,
    results: Object.assign(speechResults, {
      item: (i: number) => speechResults[i],
      length: speechResults.length,
    }),
  } as unknown as Event
}

describe('useSpeechRecognition', () => {
  it('isSupported ist true wenn SpeechRecognition vorhanden', () => {
    const { isSupported } = useSpeechRecognition()
    expect(isSupported.value).toBe(true)
  })

  it('isSupported ist false wenn SpeechRecognition fehlt', () => {
    Object.defineProperty(window, 'SpeechRecognition', { value: undefined, writable: true, configurable: true })
    const { isSupported } = useSpeechRecognition()
    expect(isSupported.value).toBe(false)
  })

  it('start() setzt isListening auf true und transcript auf leer', () => {
    const { isListening, transcript, start } = useSpeechRecognition()
    transcript.value = 'alter text'
    start()
    expect(isListening.value).toBe(true)
    expect(transcript.value).toBe('')
    expect(mockInstance.start).toHaveBeenCalled()
  })

  it('onresult setzt transcript aus interimären Ergebnissen', () => {
    const { transcript, start } = useSpeechRecognition()
    start()
    mockInstance.onresult!(makeEvent([{ transcript: 'Milch', isFinal: false }]))
    expect(transcript.value).toBe('Milch')
  })

  it('onresult akkumuliert finale und interimäre Ergebnisse', () => {
    const { transcript, start } = useSpeechRecognition()
    start()
    mockInstance.onresult!(makeEvent([
      { transcript: 'Milch ', isFinal: true },
      { transcript: 'Käse', isFinal: false },
    ]))
    expect(transcript.value).toBe('Milch Käse')
  })

  it('onend setzt isListening auf false', () => {
    const { isListening, start } = useSpeechRecognition()
    start()
    expect(isListening.value).toBe(true)
    mockInstance.onend!()
    expect(isListening.value).toBe(false)
  })

  it('onerror setzt isListening auf false', () => {
    const { isListening, start } = useSpeechRecognition()
    start()
    mockInstance.onerror!()
    expect(isListening.value).toBe(false)
  })

  it('stop() ruft recognition.stop auf', () => {
    const { start, stop } = useSpeechRecognition()
    start()
    stop()
    expect(mockInstance.stop).toHaveBeenCalled()
  })

  it('silence timer startet nach finalem Ergebnis und stoppt nach 2s', () => {
    vi.useFakeTimers()
    const { start } = useSpeechRecognition()
    start()
    mockInstance.onresult!(makeEvent([{ transcript: 'Milch', isFinal: true }]))
    vi.advanceTimersByTime(1999)
    expect(mockInstance.stop).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(mockInstance.stop).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('silence timer startet nicht bei reinem Interim-Ergebnis', () => {
    vi.useFakeTimers()
    const { start } = useSpeechRecognition()
    start()
    mockInstance.onresult!(makeEvent([{ transcript: 'Milch', isFinal: false }]))
    vi.advanceTimersByTime(3000)
    expect(mockInstance.stop).not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('dupliziert finale Ergebnisse nicht, wenn der Browser sie in mehreren Events wiederholt', () => {
    const { transcript, start } = useSpeechRecognition()
    start()
    // Event 1: erstes finales Wort
    mockInstance.onresult!(
      makeEvent([{ transcript: 'Brot ', isFinal: true }], 0),
    )
    expect(transcript.value).toBe('Brot ')
    // Event 2: Browser liefert dasselbe Final nochmal + neues Final (resultIndex zeigt auf das neue)
    mockInstance.onresult!(
      makeEvent(
        [
          { transcript: 'Brot ', isFinal: true },
          { transcript: 'Ei', isFinal: true },
        ],
        1,
      ),
    )
    expect(transcript.value).toBe('Brot Ei')
  })

  it('start() setzt den akkumulierten Final-Transcript zurück', () => {
    const { transcript, start } = useSpeechRecognition()
    start()
    mockInstance.onresult!(makeEvent([{ transcript: 'Milch', isFinal: true }], 0))
    expect(transcript.value).toBe('Milch')
    start()
    mockInstance.onresult!(makeEvent([{ transcript: 'Brot', isFinal: true }], 0))
    expect(transcript.value).toBe('Brot')
  })
})
