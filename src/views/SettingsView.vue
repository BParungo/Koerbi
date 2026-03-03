<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/composables/useAuth'
import { buildInviteLink } from '@/utils/invite'
import { supabase } from '@/lib/supabase'
import { query } from '@/lib/supabase-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, LogOut } from 'lucide-vue-next'
import type { FamilyMember } from '@/types'

const auth = useAuthStore()
const { signOut } = useAuth()

const members = ref<FamilyMember[]>([])
const copied = ref(false)

onMounted(async () => {
  if (!auth.family) return
  const { data } = await query(
    supabase.from('family_members').select('*').eq('family_id', auth.family.id),
  )
  if (data) {
    members.value = data as FamilyMember[]
  }
})

async function copyInviteCode() {
  if (!auth.family) return
  await navigator.clipboard.writeText(buildInviteLink(auth.family.invite_code))
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase()
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6 p-4">
    <h1 class="text-2xl font-bold">Einstellungen</h1>

    <!-- Family Info -->
    <Card v-if="auth.family">
      <CardHeader>
        <CardTitle>{{ auth.family.name }}</CardTitle>
        <CardDescription>Deine Familie</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Invite Code -->
        <div>
          <p class="mb-2 text-sm font-medium">Einladungscode</p>
          <div class="flex items-center gap-2">
            <Input :model-value="auth.family.invite_code" readonly class="font-mono" />
            <Button variant="outline" size="icon" @click="copyInviteCode">
              <Check v-if="copied" class="h-4 w-4" />
              <Copy v-else class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Separator />

        <!-- Members -->
        <div>
          <p class="mb-3 text-sm font-medium">Mitglieder ({{ members.length }})</p>
          <div class="space-y-3">
            <div
              v-for="m in members"
              :key="m.id"
              class="flex items-center gap-3"
            >
              <Avatar class="h-9 w-9">
                <AvatarFallback>{{ getInitials(m.name) }}</AvatarFallback>
              </Avatar>
              <div class="flex-1">
                <p class="text-sm font-medium">{{ m.name }}</p>
              </div>
              <Badge v-if="m.role === 'admin'" variant="secondary">Admin</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Account -->
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>{{ auth.user?.email }}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" class="w-full" @click="signOut">
          <LogOut class="mr-2 h-4 w-4" />
          Abmelden
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
