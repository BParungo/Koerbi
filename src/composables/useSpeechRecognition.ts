import { ref } from 'vue'

interface ISpeechAlternative {
  transcript: string
  confidence: number
}

interface ISpeechResult {
  isFinal: boolean
  length: number
  [index: number]: ISpeechAlternative
}

interface ISpeechResultList {
  length: number
  [index: number]: ISpeechResult
}

interface ISpeechEvent extends Event {
  results: ISpeechResultList
  resultIndex: number
}

interface ISpeechRecognition extends EventTarget {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: Event) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start(): void
  stop(): void
}

type SpeechRecognitionConstructor = new () => ISpeechRecognition
type WindowWithSpeech = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

function getSpeechRecognitionAPI(): SpeechRecognitionConstructor | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as WindowWithSpeech
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function useSpeechRecognition() {
  const SpeechRecognitionAPI = getSpeechRecognitionAPI()
  const isSupported = ref(!!SpeechRecognitionAPI)
  const isListening = ref(false)
  const transcript = ref('')

  if (!SpeechRecognitionAPI) {
    return {
      isSupported,
      isListening,
      transcript,
      start: () => {},
      stop: () => {},
    }
  }

  const SILENCE_TIMEOUT_MS = 2000

  const recognition = new SpeechRecognitionAPI()
  recognition.lang = 'de-DE'
  recognition.interimResults = true
  recognition.continuous = true

  let silenceTimer: ReturnType<typeof setTimeout> | null = null
  let finalTranscript = ''

  function clearSilenceTimer() {
    if (silenceTimer !== null) {
      clearTimeout(silenceTimer)
      silenceTimer = null
    }
  }

  function startSilenceTimer() {
    clearSilenceTimer()
    silenceTimer = setTimeout(() => {
      recognition.stop()
    }, SILENCE_TIMEOUT_MS)
  }

  recognition.onresult = (event: Event) => {
    const e = event as ISpeechEvent
    // Nur neue Results ab resultIndex verarbeiten — verhindert Doppelzählung,
    // wenn der Browser dieselben Finals in mehreren Events wiederholt.
    let newFinal = ''
    let interimResult = ''
    for (let i = e.resultIndex ?? 0; i < e.results.length; i++) {
      const result = e.results[i]
      const text = result?.[0]?.transcript ?? ''
      if (result?.isFinal) {
        newFinal += text
      } else {
        interimResult += text
      }
    }
    if (newFinal) {
      finalTranscript += newFinal
    }
    transcript.value = finalTranscript + interimResult
    if (newFinal) {
      startSilenceTimer()
    }
  }

  recognition.onend = () => {
    clearSilenceTimer()
    isListening.value = false
  }

  recognition.onerror = () => {
    clearSilenceTimer()
    isListening.value = false
  }

  function start() {
    transcript.value = ''
    finalTranscript = ''
    isListening.value = true
    recognition.start()
  }

  function stop() {
    clearSilenceTimer()
    recognition.stop()
  }

  return { isSupported, isListening, transcript, start, stop }
}
