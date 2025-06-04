import { createRouter, createWebHistory } from 'vue-router'

import DecksView from '@/views/DecksView.vue'
import NewView from '@/views/NewView.vue'
import EditCardView from '@/views/EditCardView.vue'
import EditDeckView from '@/views/EditDeckView.vue'
import StudyView from '@/views/StudyView.vue'
import StoreView from '@/views/StoreView.vue'
import SettingsView from '@/views/SettingsView.vue'
import LoginView from '@/views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_BASE_URL),
  routes: [
    {
      path: '/',
      name: 'decks',
      component: DecksView,
    },
    {
      path: '/new',
      name: 'new',
      component: NewView,
    },
    {
      path: '/edit/:deckId',
      name: 'edit-deck',
      component: EditDeckView,
    },
    {
      path: '/edit/:deckId/:cardId',
      name: 'edit-card',
      component: EditCardView,
    },
    {
      path: '/study/:deckId',
      name: 'study-deck',
      component: StudyView,
    },
    {
      path: '/study',
      name: 'study-all',
      component: StudyView,
    },
    {
      path: '/store',
      name: 'store',
      component: StoreView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
  ],
})

export default router
