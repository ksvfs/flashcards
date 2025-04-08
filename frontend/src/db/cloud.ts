import type { Deck, Card } from '@/types'

const backendUrl = import.meta.env.VITE_BACKEND_URL

export default {
  async getAllDecks(): Promise<Deck[]> {
    const response = await fetch(`${backendUrl}/decks`)
    if (!response.ok) throw new Error()
    const allDecks: Deck[] = await response.json()
    return allDecks
  },

  async createDeck(deck: Deck): Promise<Deck> {
    const response = await fetch(`${backendUrl}/decks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deck),
    })
    if (!response.ok) throw new Error()
    const createdDeck: Deck = await response.json()
    return createdDeck
  },

  async getAllCards(): Promise<Card[]> {
    const response = await fetch(`${backendUrl}/cards`)
    if (!response.ok) throw new Error()
    const allCards: Card[] = await response.json()
    return allCards
  },

  async getAllCardsFromDeck(deckId: string): Promise<Card[]> {
    const response = await fetch(`${backendUrl}/decks/${deckId}/cards`)
    if (!response.ok) throw new Error()
    const allCardsFromDeck: Card[] = await response.json()
    return allCardsFromDeck
  },

  async getCard(cardId: string): Promise<Card> {
    const response = await fetch(`${backendUrl}/cards/${cardId}`)
    if (!response.ok) throw new Error()
    const card: Card = await response.json()
    return card
  },

  async createCard(card: Card): Promise<Card> {
    const response = await fetch(`${backendUrl}/cards`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    })
    if (!response.ok) throw new Error()
    const createdCard: Card = await response.json()
    return createdCard
  },

  async updateCard(card: Card): Promise<Card> {
    const response = await fetch(`${backendUrl}/cards`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    })
    if (!response.ok) throw new Error()
    const updatedCard: Card = await response.json()
    return updatedCard
  },

  async deleteCard(cardId: string): Promise<void> {
    const response = await fetch(`${backendUrl}/cards/${cardId}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error()
  },
}
