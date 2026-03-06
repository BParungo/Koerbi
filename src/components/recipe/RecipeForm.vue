<script setup lang="ts">
import { ref, watch } from 'vue'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import IngredientList from './IngredientList.vue'
import { Plus, X, LoaderCircle } from 'lucide-vue-next'
import type { Recipe, CreateRecipeForm } from '@/types'
import type { IngredientRow } from './IngredientList.vue'

const props = defineProps<{
  recipe?: Recipe
  loading?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  submit: [form: CreateRecipeForm]
  cancel: []
}>()

const name = ref(props.recipe?.name ?? '')
const emoji = ref(props.recipe?.emoji ?? '🍽️')
const duration = ref(props.recipe?.duration ?? '')
const servings = ref(props.recipe?.servings ?? 4)
const category = ref(props.recipe?.category ?? '')
const steps = ref<string[]>(props.recipe?.steps?.length ? [...props.recipe.steps] : [''])
const ingredients = ref<IngredientRow[]>(
  props.recipe?.ingredients?.length
    ? props.recipe.ingredients.map((ing) => ({
        name: ing.name,
        amount: ing.amount ?? '',
        unit: ing.unit ?? '',
      }))
    : [{ name: '', amount: '', unit: '' }],
)

// Sync if recipe prop changes (e.g. after fetch)
watch(
  () => props.recipe,
  (r) => {
    if (!r) return
    name.value = r.name
    emoji.value = r.emoji ?? '🍽️'
    duration.value = r.duration ?? ''
    servings.value = r.servings ?? 4
    category.value = r.category ?? ''
    steps.value = r.steps?.length ? [...r.steps] : ['']
    ingredients.value = r.ingredients?.length
      ? r.ingredients.map((ing) => ({
          name: ing.name,
          amount: ing.amount ?? '',
          unit: ing.unit ?? '',
        }))
      : [{ name: '', amount: '', unit: '' }]
  },
)

function addStep() {
  steps.value.push('')
}

function removeStep(index: number) {
  steps.value.splice(index, 1)
}

function handleSubmit() {
  emit('submit', {
    name: name.value,
    emoji: emoji.value,
    duration: duration.value,
    servings: servings.value,
    category: category.value,
    steps: steps.value,
    ingredients: ingredients.value,
  })
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <!-- Name & Emoji -->
    <div class="flex items-end gap-3">
      <div class="w-20">
        <Label for="emoji">Emoji</Label>
        <Input id="emoji" v-model="emoji" class="text-center text-2xl" />
      </div>
      <div class="flex-1">
        <Label for="name">Name *</Label>
        <Input id="name" v-model="name" placeholder="z.B. Spaghetti Bolognese" required />
      </div>
    </div>

    <!-- Category & Duration & Servings -->
    <div class="grid grid-cols-3 gap-3">
      <div>
        <Label for="category">Kategorie</Label>
        <Input id="category" v-model="category" placeholder="z.B. Pasta" />
      </div>
      <div>
        <Label for="duration">Dauer</Label>
        <Input id="duration" v-model="duration" placeholder="z.B. 30 min" />
      </div>
      <div>
        <Label for="servings">Portionen</Label>
        <Input id="servings" v-model.number="servings" type="number" min="1" />
      </div>
    </div>

    <!-- Ingredients -->
    <div>
      <Label class="mb-2 block">Zutaten</Label>
      <IngredientList v-model="ingredients" />
    </div>

    <!-- Steps -->
    <div>
      <Label class="mb-2 block">Zubereitung</Label>
      <div class="space-y-3">
        <div v-for="(step, index) in steps" :key="index" class="flex items-start gap-2">
          <span class="mt-2.5 text-sm font-medium text-muted-foreground">{{ index + 1 }}.</span>
          <Textarea
            :model-value="step"
            placeholder="Schritt beschreiben..."
            class="min-h-[60px] flex-1"
            @update:model-value="steps[index] = $event as string"
          />
          <Button
            v-if="steps.length > 1"
            type="button"
            variant="ghost"
            size="icon"
            class="mt-1 shrink-0"
            @click="removeStep(index)"
          >
            <X class="h-4 w-4" />
          </Button>
        </div>
        <Button type="button" variant="outline" size="sm" @click="addStep">
          <Plus class="mr-1 h-4 w-4" />
          Schritt hinzufügen
        </Button>
      </div>
    </div>

    <!-- Error -->
    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <!-- Actions -->
    <div class="flex gap-3">
      <Button type="submit" class="flex-1" :disabled="loading || !name.trim()">
        <LoaderCircle v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        {{ recipe ? 'Speichern' : 'Rezept erstellen' }}
      </Button>
      <Button type="button" variant="outline" @click="emit('cancel')">
        Abbrechen
      </Button>
    </div>
  </form>
</template>
