<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFamily } from '@/composables/useFamily'
import { useAuthStore } from '@/stores/auth.store'
import { buildInviteLink } from '@/utils/invite'
import { parseInviteCode } from '@/utils/invite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Copy, Check } from 'lucide-vue-next'

const auth = useAuthStore()
const route = useRoute()
const { createFamily, joinFamily, error, loading } = useFamily()

const familyName = ref('')
const displayName = ref('')
const inviteInput = ref('')
const joinDisplayName = ref('')
const activeTab = ref<'create' | 'join'>('create')

const createdInviteCode = ref<string | null>(null)
const copied = ref(false)

watch(
  () => route.query.invite,
  (value) => {
    if (typeof value === 'string' && value.trim()) {
      inviteInput.value = parseInviteCode(value)
      activeTab.value = 'join'
    }
  },
  { immediate: true }
)

async function handleCreate() {
  const success = await createFamily(familyName.value, displayName.value)
  if (success && auth.family) {
    createdInviteCode.value = auth.family.invite_code
  }
}

async function handleJoin() {
  await joinFamily(inviteInput.value, joinDisplayName.value)
}

async function copyInviteLink() {
  if (!createdInviteCode.value) return
  await navigator.clipboard.writeText(buildInviteLink(createdInviteCode.value))
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <!-- Invite code display after family creation -->
    <Card v-if="createdInviteCode" class="w-full max-w-sm">
      <CardHeader class="text-center">
        <CardTitle>Familie erstellt!</CardTitle>
        <CardDescription> Teile diesen Einladungscode mit deiner Familie </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex items-center gap-2">
          <Input :model-value="createdInviteCode" readonly class="font-mono" />
          <Button variant="outline" size="icon" @click="copyInviteLink">
            <Check v-if="copied" class="h-4 w-4" />
            <Copy v-else class="h-4 w-4" />
          </Button>
        </div>
        <Button class="w-full" @click="$router.push({ name: 'recipes' })"> Weiter </Button>
      </CardContent>
    </Card>

    <!-- Onboarding tabs -->
    <Card v-else class="w-full max-w-sm">
      <CardHeader class="text-center">
        <CardTitle class="text-2xl">Willkommen bei Koerbi</CardTitle>
        <CardDescription> Erstelle eine neue Familie oder tritt einer bei </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs v-model="activeTab">
          <TabsList class="grid w-full grid-cols-2">
            <TabsTrigger value="create">Erstellen</TabsTrigger>
            <TabsTrigger value="join">Beitreten</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <div class="space-y-4 pt-4">
              <div class="space-y-2">
                <Label for="family-name">Familienname</Label>
                <Input id="family-name" v-model="familyName" placeholder="z.B. Familie Müller" />
              </div>
              <div class="space-y-2">
                <Label for="display-name">Dein Name</Label>
                <Input id="display-name" v-model="displayName" placeholder="z.B. Mama, Papa, Max" />
              </div>
              <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
              <Button
                class="w-full"
                :disabled="loading || !familyName || !displayName"
                @click="handleCreate"
              >
                {{ loading ? '...' : 'Familie erstellen' }}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="join">
            <div class="space-y-4 pt-4">
              <div class="space-y-2">
                <Label for="invite-code">Einladungscode</Label>
                <Input
                  id="invite-code"
                  v-model="inviteInput"
                  placeholder="Code oder Link einfügen"
                />
              </div>
              <div class="space-y-2">
                <Label for="join-display-name">Dein Name</Label>
                <Input
                  id="join-display-name"
                  v-model="joinDisplayName"
                  placeholder="z.B. Mama, Papa, Max"
                />
              </div>
              <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
              <Button
                class="w-full"
                :disabled="loading || !inviteInput || !joinDisplayName"
                @click="handleJoin"
              >
                {{ loading ? '...' : 'Familie beitreten' }}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  </div>
</template>
