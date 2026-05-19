import { ref } from 'vue'
import { useAsyncState } from '@/composables/useAsyncState'
import type { Product } from '@/types'

interface OFFResponse {
  status: number
  product?: {
    product_name?: string
    product_name_de?: string
    brands?: string
    image_front_url?: string
    image_url?: string
    allergens_tags?: string[]
    ingredients_analysis_tags?: string[]
    labels_tags?: string[]
  }
}

export function useProductLookup() {
  const { error, loading } = useAsyncState()
  const product = ref<Product | null>(null)

  async function lookup(ean: string): Promise<Product | null> {
    error.value = null
    loading.value = true
    product.value = null

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(ean)}.json`,
      )
      if (!response.ok) {
        error.value = `Fehler beim Abruf (HTTP ${response.status})`
        return null
      }
      const data = (await response.json()) as OFFResponse

      if (data.status !== 1 || !data.product) {
        error.value = 'Produkt nicht gefunden'
        return null
      }

      const p = data.product
      const result: Product = {
        ean,
        name: p.product_name_de || p.product_name || 'Unbekanntes Produkt',
        brand: p.brands || undefined,
        imageUrl: p.image_front_url || p.image_url || undefined,
        allergens: p.allergens_tags ?? [],
        ingredientAnalysis: p.ingredients_analysis_tags ?? [],
        labels: p.labels_tags ?? [],
      }
      product.value = result
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Netzwerkfehler'
      return null
    } finally {
      loading.value = false
    }
  }

  return { product, loading, error, lookup }
}
