import { useLoginStore } from '@/stores/login'
import type { Deck, Card, CardCounts, PublicDeck } from '@/../../common/types'

const backendUrl = import.meta.env.VITE_BACKEND_URL

function serializeDates(obj: any): any {
  if (obj === null || obj === undefined) return obj

  if (obj instanceof Date) {
    return { __date: obj.toISOString() }
  }

  if (typeof obj === 'object') {
    for (const key in obj) {
      obj[key] = serializeDates(obj[key])
    }
  }

  return obj
}

function deserializeDates(obj: any): any {
  if (obj === null || obj === undefined) return obj

  if (obj && typeof obj === 'object' && obj.__date) {
    return new Date(obj.__date)
  }

  if (typeof obj === 'object') {
    for (const key in obj) {
      obj[key] = deserializeDates(obj[key])
    }
  }

  return obj
}

export default {
  async getAllDecks(): Promise<Deck[]> {
    const response = await fetch(`${backendUrl}/decks`)
    if (!response.ok) throw new Error()
    const loginStore = useLoginStore()
    if (response.status != 401) loginStore.isLoggedIn = true
    const data = await response.json()
    const allDecks: Deck[] = deserializeDates(data)
    return allDecks
  },

  async createDeck(deck: Deck): Promise<Deck> {
    const response = await fetch(`${backendUrl}/decks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serializeDates(deck)),
    })
    if (!response.ok) throw new Error()
    const data = await response.json()
    const createdDeck: Deck = deserializeDates(data)
    return createdDeck
  },

  async updateDeck(deck: Deck): Promise<Deck> {
    const response = await fetch(`${backendUrl}/decks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serializeDates(deck)),
    })
    if (!response.ok) throw new Error()
    const data = await response.json()
    const updatedDeck: Deck = deserializeDates(data)
    return updatedDeck
  },

  async deleteDeck(deckId: string): Promise<void> {
    const response = await fetch(`${backendUrl}/decks/${deckId}`, {
      method: 'DELETE',
    })
    console.log(response)
    if (!response.ok) throw new Error()
  },

  async getCardCounts(): Promise<CardCounts> {
    const response = await fetch(`${backendUrl}/card-counts`)
    if (!response.ok) throw new Error()
    const data = await response.json()
    const cardCounts: CardCounts = deserializeDates(data)
    return cardCounts
  },

  async getAllCards(): Promise<Card[]> {
    const response = await fetch(`${backendUrl}/cards`)
    if (!response.ok) throw new Error()
    const data = await response.json()
    const allCards: Card[] = deserializeDates(data)
    return allCards
  },

  async getAllCardsFromDeck(deckId: string): Promise<Card[]> {
    const response = await fetch(`${backendUrl}/decks/${deckId}/cards`)
    if (!response.ok) throw new Error()
    const data = await response.json()
    const allCardsFromDeck: Card[] = deserializeDates(data)
    return allCardsFromDeck
  },

  async getCard(cardId: string): Promise<Card> {
    const response = await fetch(`${backendUrl}/cards/${cardId}`)
    if (!response.ok) throw new Error()
    const data = await response.json()
    const card: Card = deserializeDates(data)
    return card
  },

  async createCard(card: Card): Promise<Card> {
    const response = await fetch(`${backendUrl}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serializeDates(card)),
    })
    if (!response.ok) throw new Error()
    const data = await response.json()
    const createdCard: Card = deserializeDates(data)
    return createdCard
  },

  async updateCard(card: Card): Promise<Card> {
    const response = await fetch(`${backendUrl}/cards`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serializeDates(card)),
    })
    if (!response.ok) throw new Error()
    const data = await response.json()
    const updatedCard: Card = deserializeDates(data)
    return updatedCard
  },

  async deleteCard(cardId: string): Promise<void> {
    const response = await fetch(`${backendUrl}/cards/${cardId}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error()
  },

  async getPublicDecks(): Promise<PublicDeck[]> {
    const response = await fetch(`${backendUrl}/public-decks`)
    if (!response.ok) throw new Error()
    const data = await response.json()
    const publicDecks: PublicDeck[] = deserializeDates(data)
    return publicDecks
  },

  async getPublicCards(deckId: string): Promise<any[]> {
    const response = await fetch(`${backendUrl}/public-decks/${deckId}/cards`)
    if (!response.ok) throw new Error()
    const data = await response.json()
    return deserializeDates(data)
  },

  async convertToCloud(payload: { deck: Deck; cards: Card[] }): Promise<void> {
    const response = await fetch(`${backendUrl}/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serializeDates(payload)),
    })
    if (!response.ok) throw new Error()
    return
  },
}
