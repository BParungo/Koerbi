<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import IngredientList from './IngredientList.vue'
import { Plus, X, LoaderCircle, Camera } from 'lucide-vue-next'
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

function mapIngredient(ing: {
  name: string
  amount?: string | null
  unit?: string | null
}): IngredientRow {
  return { name: ing.name, amount: ing.amount ?? '', unit: ing.unit ?? '' }
}

function mapRecipeToForm(r: Recipe) {
  return {
    name: r.name,
    duration: r.duration ?? '',
    servings: r.servings ?? 4,
    category: r.category ?? '',
    steps: r.steps?.length ? [...r.steps] : [''],
    ingredients: r.ingredients?.length ? r.ingredients.map(mapIngredient) : [emptyIngredient()]
  }
}

const initial = props.recipe ? mapRecipeToForm(props.recipe) : null
const name = ref(initial?.name ?? '')
const duration = ref(initial?.duration ?? '')
const servings = ref(initial?.servings ?? 4)
const category = ref(initial?.category ?? '')
const steps = ref<string[]>(initial?.steps ?? [''])
const ingredients = ref<IngredientRow[]>(initial?.ingredients ?? [emptyIngredient()])
const imageFile = ref<File | null>(null)
const imagePreview = ref<string | null>(props.recipe?.image_url ?? null)

// Sync if recipe prop changes (e.g. after fetch)
watch(
  () => props.recipe,
  (r) => {
    if (!r) return
    const mapped = mapRecipeToForm(r)
    name.value = mapped.name
    duration.value = mapped.duration
    servings.value = mapped.servings
    category.value = mapped.category
    steps.value = mapped.steps
    ingredients.value = mapped.ingredients
    imagePreview.value = r.image_url ?? null
  }
)

function onImageChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  imageFile.value = file
  if (file) {
    imagePreview.value = URL.createObjectURL(file)
  }
}

function addStep() {
  steps.value.push('')
}

function removeStep(index: number) {
  steps.value.splice(index, 1)
}

const isDirty = computed(
  () =>
    name.value.trim() !== '' ||
    imageFile.value !== null ||
    ingredients.value.some((i) => i.name.trim() !== '')
)

useUnsavedChanges(isDirty)

function handleSubmit() {
  emit('submit', {
    name: name.value,
    duration: duration.value,
    servings: servings.value,
    category: category.value,
    steps: steps.value,
    ingredients: ingredients.value,
    image: imageFile.value
  })
}
</script>

<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <!-- Bild -->
    <div class="space-y-2">
      <Label>Foto</Label>
      <div
        class="relative flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted"
        @click="($refs.imageInput as HTMLInputElement).click()"
      >
        <img
          v-if="imagePreview"
          :src="imagePreview"
          class="h-full w-full object-cover"
          alt="Vorschau"
        />
        <div v-else class="flex flex-col items-center gap-1 text-muted-foreground">
          <Camera class="h-8 w-8" />
          <span class="text-sm">Foto aufnehmen oder wählen</span>
        </div>
      </div>
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        capture="environment"
        class="hidden"
        @change="onImageChange"
      />
    </div>

    <!-- Name -->
    <div>
      <Label for="name">Name *</Label>
      <Input id="name" v-model="name" placeholder="z.B. Spaghetti Bolognese" required />
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
            class="min-h-15 flex-1"
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
      <Button type="button" variant="outline" @click="emit('cancel')"> Abbrechen </Button>
    </div>
  </form>
</template>
