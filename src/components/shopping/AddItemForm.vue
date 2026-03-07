<script setup lang="ts">
import { computed, ref } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import { SlidersHorizontal, Plus } from 'lucide-vue-next'
import type { FamilyMember, CreateShoppingItemForm } from '@/types'

const props = defineProps<{
  members: FamilyMember[]
  loading?: boolean
  categorySuggestions?: string[]
  itemNameSuggestions?: string[]
}>()

const emit = defineEmits<{
  submit: [form: CreateShoppingItemForm]
}>()

const name = ref('')
const amount = ref('')
const unit = ref('')
const category = ref('')
const assignedTo = ref<string | null>(null)

const normalizedCategorySuggestions = computed(() => {
  const unique = new Set<string>()
  for (const value of props.categorySuggestions ?? []) {
    const normalized = value.trim()
    if (normalized) unique.add(normalized)
  }
  return Array.from(unique)
})

const normalizedItemNameSuggestions = computed(() => {
  const unique = new Set<string>()
  for (const value of props.itemNameSuggestions ?? []) {
    const normalized = value.trim()
    if (normalized) unique.add(normalized)
  }
  return Array.from(unique)
})

function handleSubmit() {
  if (!name.value.trim()) return
  emit('submit', {
    name: name.value.trim(),
    amount: amount.value || undefined,
    unit: unit.value || undefined,
    category: category.value || undefined,
    assigned_to: assignedTo.value
  })
  name.value = ''
  amount.value = ''
  unit.value = ''
  category.value = ''
  assignedTo.value = null
}
</script>

<template>
  <form class="space-y-2" @submit.prevent="handleSubmit">
    <div class="flex gap-2">
      <Input
        v-model="name"
        placeholder="Artikel hinzuf\u00FCgen..."
        list="shopping-item-name-suggestions"
        autocomplete="off"
        required
        class="h-10 flex-1"
      />
      <Button type="submit" size="icon" class="h-10 w-10" :disabled="loading || !name.trim()">
        <Plus class="h-4 w-4" />
      </Button>
    </div>

    <Accordion type="single" collapsible class="sm:hidden">
      <AccordionItem value="details" class="border-none">
        <AccordionTrigger
          class="h-9 justify-center rounded-md border border-input bg-background px-3 py-0 text-muted-foreground no-underline hover:no-underline"
          aria-label="Zusatzfelder"
        >
          <span class="inline-flex items-center gap-2 text-sm">
            <SlidersHorizontal class="h-4 w-4" />
            Zusatzfelder
          </span>
        </AccordionTrigger>
        <AccordionContent class="pb-0">
          <div class="rounded-md border border-input bg-background p-2">
            <div class="grid grid-cols-2 gap-2">
              <Input v-model="amount" placeholder="Menge" inputmode="decimal" class="h-10" />
              <Input v-model="unit" placeholder="Einheit" class="h-10" />
              <Input
                v-model="category"
                placeholder="Kategorie"
                list="shopping-category-suggestions"
                autocomplete="off"
                class="col-span-2 h-10"
              />
              <select
                v-if="members.length > 0"
                v-model="assignedTo"
                class="col-span-2 h-10 rounded-md border border-input bg-background px-2 text-sm"
              >
                <option :value="null">-</option>
                <option v-for="m in members" :key="m.id" :value="m.user_id">
                  {{ m.name }}
                </option>
              </select>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <div class="hidden grid-cols-2 gap-2 sm:grid sm:grid-cols-6">
      <Input v-model="amount" placeholder="Menge" inputmode="decimal" class="h-10" />
      <Input v-model="unit" placeholder="Einheit" class="h-10" />
      <Input
        v-model="category"
        placeholder="Kategorie"
        list="shopping-category-suggestions"
        autocomplete="off"
        class="col-span-2 h-10 sm:col-span-2"
      />
      <select
        v-if="members.length > 0"
        v-model="assignedTo"
        class="col-span-2 h-10 rounded-md border border-input bg-background px-2 text-sm sm:col-span-1"
      >
        <option :value="null">-</option>
        <option v-for="m in members" :key="m.id" :value="m.user_id">
          {{ m.name }}
        </option>
      </select>
    </div>

    <datalist id="shopping-category-suggestions">
      <option
        v-for="categoryOption in normalizedCategorySuggestions"
        :key="categoryOption"
        :value="categoryOption"
      />
    </datalist>
    <datalist id="shopping-item-name-suggestions">
      <option
        v-for="itemNameOption in normalizedItemNameSuggestions"
        :key="itemNameOption"
        :value="itemNameOption"
      />
    </datalist>
  </form>
</template>
