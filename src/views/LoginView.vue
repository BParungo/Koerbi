<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const router = useRouter()
const { signIn, signUp, error, loading } = useAuth()

const email = ref('')
const password = ref('')
const isRegister = ref(false)

async function handleSubmit() {
  const success = isRegister.value
    ? await signUp(email.value, password.value)
    : await signIn(email.value, password.value)

  if (success) {
    router.push('/')
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <Card class="w-full max-w-sm">
      <CardHeader class="text-center">
        <CardTitle class="text-3xl">Koerbi</CardTitle>
        <CardDescription>
          {{ isRegister ? 'Konto erstellen' : 'Willkommen zurück' }}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="email">E-Mail</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              required
              autocomplete="email"
              placeholder="name@beispiel.de"
            />
          </div>

          <div class="space-y-2">
            <Label for="password">Passwort</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              required
              autocomplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? '...' : isRegister ? 'Registrieren' : 'Anmelden' }}
          </Button>
        </form>
      </CardContent>

      <CardFooter class="justify-center">
        <p class="text-sm text-muted-foreground">
          {{ isRegister ? 'Bereits ein Konto?' : 'Noch kein Konto?' }}
          <button
            type="button"
            class="font-medium text-primary underline-offset-4 hover:underline"
            @click="isRegister = !isRegister"
          >
            {{ isRegister ? 'Anmelden' : 'Registrieren' }}
          </button>
        </p>
      </CardFooter>
    </Card>
  </div>
</template>
