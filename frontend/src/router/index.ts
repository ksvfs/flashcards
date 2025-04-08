import { createRouter, createWebHistory } from 'vue-router'

import DecksView from '@/views/DecksView.vue'
import NewView from '@/views/NewView.vue'
import EditView from '@/views/EditView.vue'
import StudyView from '@/views/StudyView.vue'

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
      path: '/edit/:deckId/:cardId',
      name: 'edit',
      component: EditView,
    },
    {
      path: '/study/:deckId',
      name: 'study',
      component: StudyView,
    },
  ],
})

export default router
