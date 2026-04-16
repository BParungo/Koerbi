import { watch, onUnmounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import type { Ref } from 'vue'

export function useUnsavedChanges(isDirty: Ref<boolean>) {
  function handleBeforeUnload(event: BeforeUnloadEvent) {
    event.preventDefault()
    event.returnValue = ''
  }

  watch(
    isDirty,
    (dirty) => {
      if (dirty) {
        window.addEventListener('beforeunload', handleBeforeUnload)
      } else {
        window.removeEventListener('beforeunload', handleBeforeUnload)
      }
    },
    { immediate: true },
  )

  onBeforeRouteLeave(() => {
    if (isDirty.value) {
      return window.confirm('Du hast ungespeicherte Änderungen. Seite wirklich verlassen?')
    }
  })

  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
  })
}
