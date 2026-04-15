import { ref } from 'vue'
import type { Ref } from 'vue'

export function useAsyncState(): { error: Ref<string | null>; loading: Ref<boolean> } {
  const error = ref<string | null>(null)
  const loading = ref(false)
  return { error, loading }
}
