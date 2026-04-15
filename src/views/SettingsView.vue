<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import { useAuth } from '@/composables/useAuth'
import { usePwaInstall } from '@/composables/usePwaInstall'
import { buildInviteLink } from '@/utils/invite'
import { getAvatarEmoji, getAvatarImageUrl, getAvatarFallback } from '@/utils/avatar'
import { supabase } from '@/lib/supabase'
import { query } from '@/lib/supabase-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, LogOut } from 'lucide-vue-next'
import type { FamilyMember } from '@/types'

const auth = useAuthStore()
const { signOut } = useAuth()
const { canInstall, isInstalled, showIosHint, install } = usePwaInstall()

const members = ref<FamilyMember[]>([])
const loadingMembers = ref(false)
const copyError = ref<string | null>(null)
const copied = ref(false)
const copiedInviteLink = ref(false)
const generatedInviteLink = ref('')
const profileError = ref<string | null>(null)
const profileSuccess = ref<string | null>(null)
const savingProfile = ref(false)
const installingPwa = ref(false)
const editDisplayName = ref('')
const editAvatar = ref('')

const avatarOptions = ['', 'emoji:😀', 'emoji:🐻', 'emoji:🦊', 'emoji:🐼', 'emoji:🐯']

const profileName = computed(() => auth.member?.name ?? auth.displayName)
const profileEmail = computed(() => auth.user?.email ?? 'Keine E-Mail')
const profileRole = computed(() => formatRole(auth.member?.role))
const familyMemberCount = computed(() => members.value.length)

onMounted(async () => {
  editDisplayName.value = auth.member?.name ?? ''
  editAvatar.value = auth.member?.avatar ?? ''

  await loadMembers()
})

async function loadMembers() {
  if (!auth.family) return
  loadingMembers.value = true

  const { data } = await query(
    supabase
      .from('family_members')
      .select('id, user_id, family_id, name, avatar, role, joined_at')
      .eq('family_id', auth.family.id)
      .order('joined_at', { ascending: true })
  )

  if (data) {
    members.value = data as FamilyMember[]
  }

  loadingMembers.value = false
}

async function copyInviteCode() {
  if (!auth.family) return

  try {
    copyError.value = null
    await navigator.clipboard.writeText(auth.family.invite_code)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    copyError.value = 'Kopieren nicht moeglich. Bitte manuell kopieren.'
  }
}

async function generateInviteLink() {
  if (!auth.family) return

  generatedInviteLink.value = buildInviteLink(auth.family.invite_code)

  try {
    copyError.value = null
    await navigator.clipboard.writeText(generatedInviteLink.value)
    copiedInviteLink.value = true
    setTimeout(() => (copiedInviteLink.value = false), 2000)
  } catch {
    copyError.value = 'Kopieren nicht moeglich. Bitte Link manuell kopieren.'
  }
}

function formatRole(role: string | null | undefined) {
  if (role === 'admin') return 'Admin'
  if (role === 'member') return 'Mitglied'
  return 'Unbekannt'
}

async function saveProfile() {
  if (!auth.member || !auth.user) return

  const cleanName = editDisplayName.value.trim()
  if (!cleanName) {
    profileError.value = 'Name darf nicht leer sein.'
    profileSuccess.value = null
    return
  }

  savingProfile.value = true
  profileError.value = null
  profileSuccess.value = null

  const { error } = await query(
    supabase
      .from('family_members')
      .update({
        name: cleanName,
        avatar: editAvatar.value.trim() || null
      })
      .eq('id', auth.member.id)
      .select('id')
      .single()
  )

  if (error) {
    profileError.value = error
    savingProfile.value = false
    return
  }

  await auth.fetchFamilyData(auth.user.id)
  await loadMembers()
  profileSuccess.value = 'Profil gespeichert.'
  savingProfile.value = false
}

async function installPwa() {
  installingPwa.value = true
  await install()
  installingPwa.value = false
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6 p-4">
<Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>Deine Kontoinformationen und dein Avatar</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="flex items-center gap-3 rounded-md border p-3">
          <Avatar class="h-12 w-12">
            <AvatarImage
              v-if="getAvatarImageUrl(editAvatar)"
              :src="getAvatarImageUrl(editAvatar)"
              :alt="profileName"
            />
            <AvatarFallback>{{ getAvatarFallback(editAvatar, profileName) }}</AvatarFallback>
          </Avatar>
          <div>
            <p class="text-xs text-muted-foreground">Vorschau</p>
            <p class="text-sm font-medium">{{ profileName }}</p>
          </div>
        </div>
        <div class="rounded-md border p-3">
          <p class="text-xs text-muted-foreground">Name</p>
          <p class="font-medium">{{ profileName }}</p>
        </div>
        <div class="rounded-md border p-3">
          <p class="text-xs text-muted-foreground">E-Mail</p>
          <p class="font-medium">{{ profileEmail }}</p>
        </div>
        <div class="rounded-md border p-3">
          <p class="text-xs text-muted-foreground">Rolle</p>
          <p class="font-medium">{{ profileRole }}</p>
        </div>
        <div class="space-y-2 rounded-md border p-3">
          <Label for="profile-display-name">Anzeigename bearbeiten</Label>
          <Input id="profile-display-name" v-model="editDisplayName" placeholder="z.B. Mama" />
        </div>
        <div class="space-y-2 rounded-md border p-3">
          <Label>Avatar waehlen</Label>
          <div class="grid grid-cols-6 gap-2">
            <button
              v-for="option in avatarOptions"
              :key="option || 'initials'"
              type="button"
              :aria-label="`Avatar ${getAvatarFallback(option, profileName)}`"
              :class="[
                'focus-visible:ring-ring inline-flex h-10 w-10 items-center justify-center rounded-full border text-lg transition focus-visible:ring-2 focus-visible:outline-none',
                editAvatar === option
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                  : 'border-input hover:bg-accent'
              ]"
              @click="editAvatar = option"
            >
              <span>{{ getAvatarFallback(option, profileName) }}</span>
            </button>
          </div>
        </div>
        <p v-if="profileError" class="text-sm text-destructive">{{ profileError }}</p>
        <p v-if="profileSuccess" class="text-sm text-emerald-600">{{ profileSuccess }}</p>
        <Button class="w-full" :disabled="savingProfile" @click="saveProfile">
          {{ savingProfile ? 'Speichere...' : 'Profil speichern' }}
        </Button>
      </CardContent>
    </Card>

    <!-- Family Info -->
    <Card v-if="auth.family">
      <CardHeader>
        <CardTitle>{{ auth.family.name }}</CardTitle>
        <CardDescription>Deine Familie mit {{ familyMemberCount }} Mitgliedern</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <!-- Invite Code -->
        <div>
          <p class="mb-2 text-sm font-medium">Einladungscode</p>
          <div class="flex items-center gap-2">
            <Input :model-value="auth.family.invite_code" readonly class="font-mono" />
            <Button
              variant="outline"
              size="icon"
              aria-label="Einladungscode kopieren"
              @click="copyInviteCode"
            >
              <Check v-if="copied" class="h-4 w-4" />
              <Copy v-else class="h-4 w-4" />
            </Button>
          </div>
          <p v-if="copyError" class="mt-2 text-sm text-destructive">{{ copyError }}</p>
          <Button
            variant="secondary"
            class="mt-3 w-full"
            aria-label="Einladungslink generieren"
            @click="generateInviteLink"
          >
            {{ copiedInviteLink ? 'Einladungslink kopiert' : 'Einladungslink generieren' }}
          </Button>
          <div v-if="generatedInviteLink" class="mt-3 space-y-1">
            <p class="text-xs text-muted-foreground">Generierter Einladungslink</p>
            <Input :model-value="generatedInviteLink" readonly class="font-mono text-xs" />
          </div>
        </div>

        <Separator />

        <!-- Members -->
        <div>
          <p class="mb-3 text-sm font-medium">Mitglieder ({{ familyMemberCount }})</p>
          <p v-if="loadingMembers" class="text-sm text-muted-foreground">Lade Mitglieder...</p>
          <div v-else class="space-y-3">
            <div v-for="m in members" :key="m.id" class="flex items-center gap-3">
              <Avatar class="h-9 w-9">
                <AvatarImage
                  v-if="getAvatarImageUrl(m.avatar)"
                  :src="getAvatarImageUrl(m.avatar)"
                  :alt="m.name"
                />
                <AvatarFallback>{{ getAvatarFallback(m.avatar, m.name) }}</AvatarFallback>
              </Avatar>
              <div class="flex-1">
                <p class="text-sm font-medium">{{ m.name }}</p>
              </div>
              <Badge variant="secondary">{{ formatRole(m.role) }}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>App installieren</CardTitle>
        <CardDescription>Schneller Zugriff direkt vom Homescreen</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <p v-if="isInstalled" class="text-sm text-emerald-600">App ist bereits installiert.</p>

        <Button v-else-if="canInstall" class="w-full" :disabled="installingPwa" @click="installPwa">
          {{ installingPwa ? 'Installiere...' : 'App installieren' }}
        </Button>

        <div v-else-if="showIosHint" class="space-y-1 text-sm text-muted-foreground">
          <p>Auf iOS gibt es keinen automatischen Install-Prompt.</p>
          <p>Safari: Teilen -> Zum Home-Bildschirm.</p>
        </div>

        <p v-else class="text-sm text-muted-foreground">
          Install-Option wird angezeigt, sobald dein Browser die Voraussetzungen erfuellt.
        </p>
      </CardContent>
    </Card>

    <!-- Account -->
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>{{ profileEmail }}</CardDescription>
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
