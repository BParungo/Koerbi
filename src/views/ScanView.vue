<script setup lang="ts">
import { onMounted, ref, computed, onBeforeUnmount, nextTick } from 'vue'
import { supabase } from '@/lib/supabase'
import { query } from '@/lib/supabase-query'
import { useAuthStore } from '@/stores/auth.store'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { useProductLookup } from '@/composables/useProductLookup'
import { useMemberPreferences } from '@/composables/useMemberPreferences'
import { checkProduct } from '@/utils/productCheck'
import { getAvatarFallback, getAvatarImageUrl } from '@/utils/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScanLine, LoaderCircle, RotateCcw, AlertTriangle, Check, X } from 'lucide-vue-next'
import type { FamilyMember } from '@/types'

const SCANNER_ELEMENT_ID = 'barcode-scanner-region'

const auth = useAuthStore()
const scanner = useBarcodeScanner()
const lookup = useProductLookup()
const prefsState = useMemberPreferences()

const members = ref<FamilyMember[]>([])

const results = computed(() => {
  if (!lookup.product.value) return []
  return checkProduct(lookup.product.value, members.value, prefsState.preferences.value)
})

onMounted(async () => {
  await Promise.all([loadMembers(), prefsState.fetchFamilyPreferences()])
  await startScan()
})

onBeforeUnmount(() => {
  void scanner.stop()
})

async function loadMembers() {
  if (!auth.family) return
  const { data } = await query(
    supabase
      .from('family_members')
      .select('id, user_id, family_id, name, avatar, role, joined_at')
      .eq('family_id', auth.family.id),
  )
  if (data) members.value = data as FamilyMember[]
}

async function startScan() {
  await scanner.start(SCANNER_ELEMENT_ID, async (ean) => {
    await scanner.stop()
    await lookup.lookup(ean)
  })
}

async function rescan() {
  lookup.product.value = null
  lookup.error.value = null
  await nextTick()
  await startScan()
}

function statusColor(status: 'ok' | 'warning' | 'danger'): string {
  if (status === 'ok') return 'text-success'
  if (status === 'warning') return 'text-warning'
  return 'text-destructive'
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-4 p-4">
    <div class="flex items-center gap-2">
      <ScanLine class="h-5 w-5" />
      <h1 class="text-xl font-semibold">Produktscanner</h1>
    </div>

    <p v-if="!scanner.isSupported.value" class="rounded-md border bg-muted p-4 text-sm">
      Dein Browser unterstützt keinen Kamerazugriff.
    </p>

    <!-- Scanner / Loading -->
    <div v-if="!lookup.product.value">
      <div
        :id="SCANNER_ELEMENT_ID"
        class="relative h-[70vh] w-full overflow-hidden rounded-md border bg-black [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
      />
      <p v-if="scanner.error.value" class="mt-2 text-sm text-destructive">
        {{ scanner.error.value }}
      </p>
      <p v-if="lookup.loading.value" class="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderCircle class="h-4 w-4 animate-spin" />
        Produkt wird abgefragt...
      </p>
      <p v-else-if="lookup.error.value" class="mt-2 text-sm text-destructive">
        {{ lookup.error.value }}
        <Button variant="link" class="px-1" @click="rescan">Erneut scannen</Button>
      </p>
      <p v-else class="mt-2 text-sm text-muted-foreground">
        Barcode in den sichtbaren Bereich halten.
      </p>
    </div>

    <!-- Product result -->
    <div v-else class="space-y-4">
      <Card>
        <CardContent class="flex gap-3 p-4">
          <img
            v-if="lookup.product.value.imageUrl"
            :src="lookup.product.value.imageUrl"
            :alt="lookup.product.value.name"
            class="h-20 w-20 rounded-md object-cover"
          />
          <div class="flex-1">
            <p class="font-semibold">{{ lookup.product.value.name }}</p>
            <p v-if="lookup.product.value.brand" class="text-sm text-muted-foreground">
              {{ lookup.product.value.brand }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">EAN: {{ lookup.product.value.ean }}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="space-y-2 p-4">
          <p class="text-sm font-medium">Familien-Check</p>
          <div
            v-for="r in results"
            :key="r.member.id"
            class="flex items-center gap-3 rounded-md border p-2"
          >
            <Avatar class="h-8 w-8">
              <AvatarImage
                v-if="getAvatarImageUrl(r.member.avatar)"
                :src="getAvatarImageUrl(r.member.avatar)"
                :alt="r.member.name"
              />
              <AvatarFallback>{{ getAvatarFallback(r.member.avatar, r.member.name) }}</AvatarFallback>
            </Avatar>
            <div class="flex-1">
              <p class="text-sm font-medium">{{ r.member.name }}</p>
              <p v-if="r.reasons.length" class="text-xs text-muted-foreground">
                {{ r.reasons.join(', ') }}
              </p>
              <p v-else class="text-xs text-muted-foreground">passt</p>
            </div>
            <Check v-if="r.status === 'ok'" :class="['h-5 w-5', statusColor(r.status)]" />
            <AlertTriangle
              v-else-if="r.status === 'warning'"
              :class="['h-5 w-5', statusColor(r.status)]"
            />
            <X v-else :class="['h-5 w-5', statusColor(r.status)]" />
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" class="w-full" @click="rescan">
        <RotateCcw class="mr-2 h-4 w-4" />
        Nächsten Barcode scannen
      </Button>
    </div>
  </div>
</template>
