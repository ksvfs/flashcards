import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Deck } from '@/../../common/types'

export const useDecksStore = defineStore('decks', () => {
  const decks = ref<Deck[]>([])
  const decksFetched = ref(false)
  return { decks, decksFetched }
})
