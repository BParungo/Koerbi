<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useShoppingStore } from '@/stores/shopping.store'
import { useAuthStore } from '@/stores/auth.store'
import { useShopping } from '@/composables/useShopping'
import { supabase } from '@/lib/supabase'
import { query } from '@/lib/supabase-query'
import ProgressBar from '@/components/shopping/ProgressBar.vue'
import AddItemForm from '@/components/shopping/AddItemForm.vue'
import ShoppingList from '@/components/shopping/ShoppingList.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import type { FamilyMember, CreateShoppingItemForm } from '@/types'

const store = useShoppingStore()
const auth = useAuthStore()
const {
  loading: addLoading,
  fetchLists,
  createList,
  deleteList,
  renameList,
  switchList,
  addItem,
  toggleItem,
  deleteItem,
  clearDone,
  assignItem,
  subscribeRealtime,
  unsubscribeRealtime,
} = useShopping()

const members = ref<FamilyMember[]>([])
const recipeNames = ref<Record<string, string>>({})
const showNewListDialog = ref(false)
const newListName = ref('')
const showRenameDialog = ref(false)
const renameValue = ref('')
const showDeleteListDialog = ref(false)

const activeListName = computed(() => store.activeList?.name ?? 'Einkaufsliste')

const categorySuggestions = computed(() => {
  const unique = new Set<string>()
  for (const item of store.activeList?.items ?? []) {
    const category = item.category?.trim()
    if (category) unique.add(category)
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b, 'de'))
})

const itemNameSuggestions = computed(() => {
  const unique = new Set<string>()
  for (const item of store.activeList?.items ?? []) {
    const itemName = item.name?.trim()
    if (itemName) unique.add(itemName)
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b, 'de'))
})

onMounted(async () => {
  await fetchLists()
  subscribeRealtime()

  if (auth.family) {
    const { data } = await query(
      supabase.from('family_members').select('*').eq('family_id', auth.family.id),
    )
    if (data) members.value = data as FamilyMember[]

    // Load recipe names for items with from_recipe_id
    const { data: recipes } = await query(
      supabase.from('recipes').select('id, name').eq('family_id', auth.family.id),
    )
    if (recipes) {
      for (const r of recipes) {
        recipeNames.value[r.id] = r.name
      }
    }
  }
})

onUnmounted(() => {
  unsubscribeRealtime()
})

async function handleAddItem(form: CreateShoppingItemForm) {
  await addItem(form)
}

async function handleCreateList() {
  if (!newListName.value.trim()) return
  await createList(newListName.value.trim())
  newListName.value = ''
  showNewListDialog.value = false
  subscribeRealtime()
}

async function handleSwitchList(listId: string) {
  await switchList(listId)
}

async function handleAssignItem(id: string, userId: string | null) {
  await assignItem(id, userId)
}

function openRenameDialog() {
  renameValue.value = store.activeList?.name ?? ''
  showRenameDialog.value = true
}

async function handleRename() {
  if (!store.activeListId || !renameValue.value.trim()) return
  await renameList(store.activeListId, renameValue.value.trim())
  showRenameDialog.value = false
}

async function handleDeleteList() {
  if (!store.activeListId) return
  await deleteList(store.activeListId)
  showDeleteListDialog.value = false
  subscribeRealtime()
}
</script>

<template>
  <div class="mx-auto max-w-lg space-y-4 p-4">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">Einkaufsliste</h1>
      <Button size="sm" variant="outline" @click="showNewListDialog = true">
        <Plus class="mr-1 h-4 w-4" />
        Neue Liste
      </Button>
    </div>

    <LoadingSpinner v-if="store.loading" />

    <template v-else>
      <!-- List Switcher -->
      <div v-if="store.lists.length > 1" class="flex gap-2 overflow-x-auto pb-1">
        <Button
          v-for="list in store.lists"
          :key="list.id"
          :variant="store.activeListId === list.id ? 'default' : 'outline'"
          size="sm"
          @click="handleSwitchList(list.id)"
        >
          {{ list.name ?? 'Einkaufsliste' }}
        </Button>
      </div>

      <template v-if="store.activeList">
        <!-- List actions -->
        <div class="flex items-center gap-2">
          <h2 v-if="store.lists.length <= 1" class="flex-1 text-sm font-medium">
            {{ activeListName }}
          </h2>
          <div class="ml-auto flex gap-1">
            <Button variant="ghost" size="icon" class="h-8 w-8" @click="openRenameDialog">
              <Pencil class="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8 text-muted-foreground hover:text-destructive"
              @click="showDeleteListDialog = true"
            >
              <Trash2 class="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <!-- Progress -->
        <ProgressBar v-if="store.activeList.items.length" :progress="store.progress" />

        <!-- Add Item -->
        <AddItemForm
          :members="members"
          :loading="addLoading"
          :category-suggestions="categorySuggestions"
          :item-name-suggestions="itemNameSuggestions"
          @submit="handleAddItem"
        />

        <!-- List -->
        <ShoppingList
          :pending-items="store.pendingItems"
          :done-items="store.doneItems"
          :members="members"
          :recipe-names="recipeNames"
          @toggle="toggleItem"
          @delete="deleteItem"
          @assign="handleAssignItem"
          @clear-done="clearDone"
        />
      </template>

      <!-- No lists -->
      <div v-else class="py-12 text-center">
        <p class="text-4xl">&#x1F6D2;</p>
        <p class="mt-2 text-muted-foreground">Noch keine Einkaufsliste vorhanden</p>
        <Button variant="outline" class="mt-4" @click="showNewListDialog = true">
          <Plus class="mr-1 h-4 w-4" />
          Erste Liste erstellen
        </Button>
      </div>
    </template>

    <!-- New List Dialog -->
    <Dialog v-model:open="showNewListDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Einkaufsliste</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="handleCreateList">
          <Input
            v-model="newListName"
            placeholder="z.B. Wocheneinkauf"
            required
            class="mb-4"
          />
          <DialogFooter>
            <Button variant="outline" type="button" @click="showNewListDialog = false">
              Abbrechen
            </Button>
            <Button type="submit" :disabled="!newListName.trim()">
              Erstellen
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Rename Dialog -->
    <Dialog v-model:open="showRenameDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Liste umbenennen</DialogTitle>
        </DialogHeader>
        <form @submit.prevent="handleRename">
          <Input
            v-model="renameValue"
            required
            class="mb-4"
          />
          <DialogFooter>
            <Button variant="outline" type="button" @click="showRenameDialog = false">
              Abbrechen
            </Button>
            <Button type="submit" :disabled="!renameValue.trim()">
              Speichern
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- Delete List Dialog -->
    <Dialog v-model:open="showDeleteListDialog">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Liste l&#246;schen?</DialogTitle>
          <DialogDescription>
            &#8222;{{ activeListName }}&#8220; und alle Artikel werden unwiderruflich gel&#246;scht.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteListDialog = false">Abbrechen</Button>
          <Button variant="destructive" @click="handleDeleteList">L&#246;schen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
