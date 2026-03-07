import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: () => import('@/views/OnboardingView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/invite/:code',
      name: 'invite',
      redirect: (to) => ({ name: 'onboarding', query: { invite: String(to.params.code ?? '') } }),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      redirect: '/recipes',
      meta: { requiresAuth: true, requiresFamily: true }
    },
    {
      path: '/recipes',
      name: 'recipes',
      component: () => import('@/views/RecipesView.vue'),
      meta: { requiresAuth: true, requiresFamily: true }
    },
    {
      path: '/recipes/new',
      name: 'recipe-new',
      component: () => import('@/views/RecipeFormView.vue'),
      meta: { requiresAuth: true, requiresFamily: true }
    },
    {
      path: '/recipes/:id',
      name: 'recipe-detail',
      component: () => import('@/views/RecipeDetailView.vue'),
      meta: { requiresAuth: true, requiresFamily: true }
    },
    {
      path: '/recipes/:id/edit',
      name: 'recipe-edit',
      component: () => import('@/views/RecipeFormView.vue'),
      meta: { requiresAuth: true, requiresFamily: true }
    },
    {
      path: '/shopping',
      name: 'shopping',
      component: () => import('@/views/ShoppingView.vue'),
      meta: { requiresAuth: true, requiresFamily: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true, requiresFamily: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/'
    }
  ]
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Wait for auth initialization
  if (auth.loading) {
    await new Promise<void>((resolve) => {
      const unwatch = auth.$subscribe(() => {
        if (!auth.loading) {
          unwatch()
          resolve()
        }
      })
      // If already resolved while setting up
      if (!auth.loading) {
        unwatch()
        resolve()
      }
    })
  }

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresGuest && auth.isLoggedIn) return { name: 'recipes' }
  if (to.meta.requiresFamily && !auth.isInFamily) return { name: 'onboarding' }
})

export default router
