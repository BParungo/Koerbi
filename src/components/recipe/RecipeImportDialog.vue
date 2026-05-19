<script setup lang="ts">
import { ref } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LoaderCircle, Camera, FileText, Globe, ClipboardPaste } from 'lucide-vue-next'
import { useRecipeImport } from '@/composables/useRecipeImport'
import type { ImportedRecipe } from '@/composables/useRecipeImport'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  imported: [recipe: ImportedRecipe]
}>()

const { importRecipe, loading, error } = useRecipeImport()

const activeTab = ref<'image' | 'pdf' | 'url' | 'text'>('url')
const urlInput = ref('')
const textInput = ref('')
const imageFile = ref<File | null>(null)
const pdfFile = ref<File | null>(null)

function onClose() {
  emit('update:open', false)
  urlInput.value = ''
  textInput.value = ''
  imageFile.value = null
  pdfFile.value = null
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function onImageChange(event: Event) {
  const input = event.target as HTMLInputElement
  imageFile.value = input.files?.[0] ?? null
}

function onPdfChange(event: Event) {
  const input = event.target as HTMLInputElement
  pdfFile.value = input.files?.[0] ?? null
}

async function onImport() {
  let result: ImportedRecipe | null = null

  if (activeTab.value === 'url') {
    if (!urlInput.value.trim()) return
    result = await importRecipe('url', urlInput.value.trim())
  } else if (activeTab.value === 'text') {
    if (!textInput.value.trim()) return
    result = await importRecipe('text', textInput.value.trim())
  } else if (activeTab.value === 'image') {
    if (!imageFile.value) return
    const base64 = await fileToBase64(imageFile.value)
    result = await importRecipe('image', base64)
  } else if (activeTab.value === 'pdf') {
    if (!pdfFile.value) return
    const base64 = await fileToBase64(pdfFile.value)
    result = await importRecipe('pdf', base64)
  }

  if (result) {
    emit('imported', result)
    onClose()
  }
}

function canImport(): boolean {
  if (loading.value) return false
  if (activeTab.value === 'url') return urlInput.value.trim().length > 0
  if (activeTab.value === 'text') return textInput.value.trim().length > 0
  if (activeTab.value === 'image') return imageFile.value !== null
  if (activeTab.value === 'pdf') return pdfFile.value !== null
  return false
}
</script>

<template>
  <Dialog :open="props.open" @update:open="onClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Rezept importieren</DialogTitle>
        <DialogDescription>
          Importiere ein Rezept von einer Website, aus Text, einem Foto oder PDF.
        </DialogDescription>
      </DialogHeader>

      <Tabs v-model="activeTab" class="mt-2">
        <TabsList class="grid w-full grid-cols-4">
          <TabsTrigger value="url">
            <Globe class="mr-1.5 h-4 w-4" />
            Website
          </TabsTrigger>
          <TabsTrigger value="text">
            <ClipboardPaste class="mr-1.5 h-4 w-4" />
            Text
          </TabsTrigger>
          <TabsTrigger value="image">
            <Camera class="mr-1.5 h-4 w-4" />
            Foto
          </TabsTrigger>
          <TabsTrigger value="pdf">
            <FileText class="mr-1.5 h-4 w-4" />
            PDF
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" class="mt-4 space-y-2">
          <Label for="import-url">Website-URL</Label>
          <Input
            id="import-url"
            v-model="urlInput"
            type="url"
            placeholder="https://example.com/rezept"
            @keyup.enter="canImport() && onImport()"
          />
        </TabsContent>

        <TabsContent value="text" class="mt-4 space-y-2">
          <Label for="import-text">Rezepttext einfügen</Label>
          <Textarea
            id="import-text"
            v-model="textInput"
            placeholder="Rezepttext hier einfügen..."
            class="h-28 resize-none"
          />
        </TabsContent>

        <TabsContent value="image" class="mt-4 space-y-2">
          <Label for="import-image">Foto auswählen</Label>
          <input
            id="import-image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            class="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            @change="onImageChange"
          />
          <p v-if="imageFile" class="text-sm text-muted-foreground">{{ imageFile.name }}</p>
        </TabsContent>

        <TabsContent value="pdf" class="mt-4 space-y-2">
          <Label for="import-pdf">PDF auswählen</Label>
          <input
            id="import-pdf"
            type="file"
            accept="application/pdf"
            class="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
            @change="onPdfChange"
          />
          <p v-if="pdfFile" class="text-sm text-muted-foreground">{{ pdfFile.name }}</p>
        </TabsContent>
      </Tabs>

      <p v-if="error" class="mt-2 text-sm text-destructive">{{ error }}</p>

      <div class="mt-4 flex justify-end gap-2">
        <Button variant="outline" :disabled="loading" @click="onClose">Abbrechen</Button>
        <Button :disabled="!canImport()" @click="onImport">
          <LoaderCircle v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          <span>{{ loading ? 'Wird importiert…' : 'Importieren' }}</span>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
