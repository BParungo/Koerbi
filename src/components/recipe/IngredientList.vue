<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-vue-next'

export interface IngredientRow {
  name: string
  amount: string
  unit: string
}

const model = defineModel<IngredientRow[]>({ required: true })

function addRow() {
  model.value = [...model.value, { name: '', amount: '', unit: '' }]
}

function removeRow(index: number) {
  model.value = model.value.filter((_, i) => i !== index)
}

function updateRow(index: number, field: keyof IngredientRow, value: string) {
  const updated = [...model.value]
  const row = updated[index]!
  updated[index] = { name: row.name, amount: row.amount, unit: row.unit, [field]: value }
  model.value = updated
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(ing, index) in model"
      :key="index"
      class="flex items-center gap-2"
    >
      <Input
        :model-value="ing.name"
        placeholder="Zutat"
        class="flex-1"
        @update:model-value="updateRow(index, 'name', $event as string)"
      />
      <Input
        :model-value="ing.amount"
        placeholder="Menge"
        class="w-20"
        @update:model-value="updateRow(index, 'amount', $event as string)"
      />
      <Input
        :model-value="ing.unit"
        placeholder="Einheit"
        class="w-20"
        @update:model-value="updateRow(index, 'unit', $event as string)"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        class="shrink-0"
        @click="removeRow(index)"
      >
        <X class="h-4 w-4" />
      </Button>
    </div>

    <Button type="button" variant="outline" size="sm" @click="addRow">
      <Plus class="mr-1 h-4 w-4" />
      Zutat hinzufügen
    </Button>
  </div>
</template>
