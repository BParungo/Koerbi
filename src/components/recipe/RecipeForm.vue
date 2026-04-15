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

function emptyIngredient(): IngredientRow {
  return { name: '', amount: '', unit: '' }
}

function mapIngredient(ing: { name: string; amount?: string | null; unit?: string | null }): IngredientRow {
  return { name: ing.name, amount: ing.amount ?? '', unit: ing.unit ?? '' }
}

function mapRecipeToForm(r: Recipe) {
  return {
    name: r.name,
    emoji: r.emoji ?? '🍽️',
    duration: r.duration ?? '',
    servings: r.servings ?? 4,
    category: r.category ?? '',
    steps: r.steps?.length ? [...r.steps] : [''],
    ingredients: r.ingredients?.length ? r.ingredients.map(mapIngredient) : [emptyIngredient()],
  }
}

const initial = props.recipe ? mapRecipeToForm(props.recipe) : null
const name = ref(initial?.name ?? '')
const emoji = ref(initial?.emoji ?? '🍽️')
const duration = ref(initial?.duration ?? '')
const servings = ref(initial?.servings ?? 4)
const category = ref(initial?.category ?? '')
const steps = ref<string[]>(initial?.steps ?? [''])
const ingredients = ref<IngredientRow[]>(initial?.ingredients ?? [emptyIngredient()])

// Sync if recipe prop changes (e.g. after fetch)
watch(
  () => props.recipe,
  (r) => {
    if (!r) return
    const mapped = mapRecipeToForm(r)
    name.value = mapped.name
    emoji.value = mapped.emoji
    duration.value = mapped.duration
    servings.value = mapped.servings
    category.value = mapped.category
    steps.value = mapped.steps
    ingredients.value = mapped.ingredients
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
