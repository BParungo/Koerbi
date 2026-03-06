import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Recipe } from '@/types'

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)
  const searchQuery = ref('')
  const activeCategory = ref('Alle')

  const categories = computed(() => {
    const cats = new Set(recipes.value.map((r) => r.category).filter(Boolean))
    return ['Alle', ...cats] as string[]
  })

  const filteredRecipes = computed(() => {
    return recipes.value.filter((r) => {
      const matchSearch = r.name.toLowerCase().includes(searchQuery.value.toLowerCase())
      const matchCat = activeCategory.value === 'Alle' || r.category === activeCategory.value
      return matchSearch && matchCat
    })
  })

  function $reset() {
    recipes.value = []
    loading.value = false
    searchQuery.value = ''
    activeCategory.value = 'Alle'
  }

  return {
    recipes,
    loading,
    searchQuery,
    activeCategory,
    categories,
    filteredRecipes,
    $reset,
  }
})
