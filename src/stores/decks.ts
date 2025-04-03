import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Deck } from '@/types'

export const useDecksStore = defineStore('decks', () => {
  const decks = ref<Deck[]>([])
  return { decks }
})
