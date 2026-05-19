<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useMemberPreferences } from '@/composables/useMemberPreferences'
import { PREFERENCE_DEFS } from '@/utils/preferences'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const auth = useAuthStore()
const { preferences, loading, error, fetchFamilyPreferences, togglePreference } =
  useMemberPreferences()

const allergyDefs = computed(() => PREFERENCE_DEFS.filter((p) => p.type === 'allergy'))
const dietDefs = computed(() => PREFERENCE_DEFS.filter((p) => p.type === 'diet'))

const myPrefs = computed(() => {
  if (!auth.member) return new Set<string>()
  return new Set(
    preferences.value
      .filter((p) => p.member_id === auth.member!.id)
      .map((p) => `${p.type}:${p.value}`),
  )
})

function isActive(type: 'allergy' | 'diet', value: string) {
  return myPrefs.value.has(`${type}:${value}`)
}

onMounted(() => {
  void fetchFamilyPreferences()
})
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Ernährung & Allergien</CardTitle>
      <CardDescription>
        Wird beim Produktscan zur Prüfung verwendet. Nur deine eigenen Präferenzen.
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div>
        <p class="mb-2 text-sm font-medium">Allergien</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="def in allergyDefs"
            :key="def.value"
            type="button"
            :disabled="loading"
            @click="togglePreference(def.type, def.value)"
          >
            <Badge :variant="isActive(def.type, def.value) ? 'default' : 'outline'">
              {{ def.label }}
            </Badge>
          </button>
        </div>
      </div>
      <div>
        <p class="mb-2 text-sm font-medium">Ernährung</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="def in dietDefs"
            :key="def.value"
            type="button"
            :disabled="loading"
            @click="togglePreference(def.type, def.value)"
          >
            <Badge :variant="isActive(def.type, def.value) ? 'default' : 'outline'">
              {{ def.label }}
            </Badge>
          </button>
        </div>
      </div>
      <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
    </CardContent>
  </Card>
</template>
