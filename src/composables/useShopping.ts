import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import { query } from '@/lib/supabase-query'
import { useAuthStore } from '@/stores/auth.store'
import { useShoppingStore } from '@/stores/shopping.store'
import type { ShoppingItem, ShoppingList, CreateShoppingItemForm } from '@/types'

export function useShopping() {
  const auth = useAuthStore()
  const store = useShoppingStore()
  const error = ref<string | null>(null)
  const loading = ref(false)

  let subscription: ReturnType<typeof supabase.channel> | null = null

  async function fetchLists() {
    if (!auth.family) return
    store.loading = true

    const { data } = await query(
      supabase
        .from('shopping_lists')
        .select('*')
        .eq('family_id', auth.family.id)
        .order('created_at', { ascending: false }),
    )

    if (data) {
      // Store lists without items — items are lazy-loaded per active list
      store.lists = data.map((list) => ({ ...list, items: [] }))

      // Auto-select first list and load its items
      if (data.length && !store.activeListId) {
        store.activeListId = data[0]!.id
      }
      if (store.activeListId) {
        await loadItemsForList(store.activeListId)
      }
    }

    store.loading = false
  }

  async function loadItemsForList(listId: string) {
    const list = store.lists.find((l) => l.id === listId)
    if (!list) return

    const { data: items } = await query(
      supabase
        .from('shopping_items')
        .select('*')
        .eq('list_id', listId)
        .order('sort_order'),
    )
    list.items = (items as ShoppingItem[]) ?? []
  }

  async function createList(name: string): Promise<ShoppingList | null> {
    if (!auth.family || !auth.user) return null
    error.value = null

    const { data, error: err } = await query(
      supabase
        .from('shopping_lists')
        .insert({
          family_id: auth.family.id,
          created_by: auth.user.id,
          name,
        })
        .select()
        .single(),
    )

    if (err || !data) {
      error.value = err ?? 'Liste konnte nicht erstellt werden'
      return null
    }

    const newList: ShoppingList = { ...data, items: [] }
    store.lists.unshift(newList)
    store.activeListId = newList.id
    return newList
  }

  async function switchList(listId: string) {
    unsubscribeRealtime()
    store.activeListId = listId
    // Lazy-load items if not yet loaded
    const list = store.lists.find((l) => l.id === listId)
    if (list && !list.items.length) {
      await loadItemsForList(listId)
    }
    subscribeRealtime()
  }

  async function deleteList(listId: string): Promise<boolean> {
    const { error: err } = await query(
      supabase.from('shopping_lists').delete().eq('id', listId).select().single(),
    )
    if (err) {
      error.value = err
      return false
    }

    store.lists = store.lists.filter((l) => l.id !== listId)

    // Switch to another list if the deleted one was active
    if (store.activeListId === listId) {
      unsubscribeRealtime()
      store.activeListId = store.lists[0]?.id ?? null
      if (store.activeListId) {
        await loadItemsForList(store.activeListId)
        subscribeRealtime()
      }
    }
    return true
  }

  async function renameList(listId: string, name: string): Promise<boolean> {
    const { error: err } = await query(
      supabase.from('shopping_lists').update({ name }).eq('id', listId).select().single(),
    )
    if (err) {
      error.value = err
      return false
    }

    const list = store.lists.find((l) => l.id === listId)
    if (list) list.name = name
    return true
  }

  async function addItem(form: CreateShoppingItemForm) {
    if (!store.activeList || !auth.family) return
    error.value = null
    loading.value = true

    const { data, error: addErr } = await query(
      supabase
        .from('shopping_items')
        .insert({
          list_id: store.activeList.id,
          family_id: auth.family.id,
          name: form.name,
          amount: form.amount || null,
          unit: form.unit || null,
          category: form.category || null,
          assigned_to: form.assigned_to ?? null,
        })
        .select()
        .single(),
    )

    if (addErr) {
      error.value = addErr
    } else if (data) {
      store.activeList.items.push(data as ShoppingItem)
    }
    loading.value = false
  }

  async function toggleItem(id: string) {
    if (!store.activeList || !auth.user) return
    const item = store.activeList.items.find((i) => i.id === id)
    if (!item) return

    // Optimistic update
    const newDone = !item.done
    item.done = newDone
    item.done_by = newDone ? auth.user.id : null
    item.done_at = newDone ? new Date().toISOString() : null

    await supabase
      .from('shopping_items')
      .update({
        done: newDone,
        done_by: item.done_by,
        done_at: item.done_at,
      })
      .eq('id', id)
  }

  async function deleteItem(id: string) {
    if (!store.activeList) return

    await supabase.from('shopping_items').delete().eq('id', id)
    store.activeList.items = store.activeList.items.filter((i) => i.id !== id)
  }

  async function clearDone() {
    if (!store.activeList) return
    const doneIds = store.doneItems.map((i) => i.id)
    if (!doneIds.length) return

    await supabase.from('shopping_items').delete().in('id', doneIds)
    store.activeList.items = store.activeList.items.filter((i) => !i.done)
  }

  async function assignItem(id: string, userId: string | null) {
    if (!store.activeList) return
    const item = store.activeList.items.find((i) => i.id === id)
    if (!item) return

    item.assigned_to = userId
    await supabase.from('shopping_items').update({ assigned_to: userId }).eq('id', id)
  }

  function subscribeRealtime() {
    if (!store.activeList) return

    subscription = supabase
      .channel(`shopping_list_${store.activeList.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shopping_items',
          filter: `list_id=eq.${store.activeList.id}`,
        },
        (payload) => {
          if (!store.activeList) return

          if (payload.eventType === 'INSERT') {
            const exists = store.activeList.items.find(
              (i) => i.id === (payload.new as ShoppingItem).id,
            )
            if (!exists) store.activeList.items.push(payload.new as ShoppingItem)
          }

          if (payload.eventType === 'UPDATE') {
            const idx = store.activeList.items.findIndex(
              (i) => i.id === (payload.new as ShoppingItem).id,
            )
            if (idx !== -1) store.activeList.items[idx] = payload.new as ShoppingItem
          }

          if (payload.eventType === 'DELETE') {
            store.activeList.items = store.activeList.items.filter(
              (i) => i.id !== (payload.old as { id: string }).id,
            )
          }
        },
      )
      .subscribe()
  }

  function unsubscribeRealtime() {
    subscription?.unsubscribe()
    subscription = null
  }

  return {
    error,
    loading,
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
  }
}
