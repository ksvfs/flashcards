import type { Deck, Card, CardCounts } from '@/../../common/types'

let dbPromise: Promise<IDBDatabase> | null = null

function serializeDates(obj: any): any {
  const clone = structuredClone(obj)
  
  for (const key in clone) {
    if (clone[key] instanceof Date) {
      continue
    } else if (typeof clone[key] === 'object' && clone[key] !== null) {
      clone[key] = serializeDates(clone[key])
    }
  }
  
  return clone
}

function deserializeDates(obj: any): any {
  if (!obj) return obj
  
  const clone = structuredClone(obj)
  
  for (const key in clone) {
    if (clone[key] && typeof clone[key] === 'object') {
      if (key === 'due' || key === 'created' || key === 'updated' || key === 'last_review') {
        clone[key] = new Date(clone[key])
      } else {
        clone[key] = deserializeDates(clone[key])
      }
    }
  }
  
  return clone
}

async function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('flashcards', 1)

    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('decks', { keyPath: '_id' })
      db.createObjectStore('cards', { keyPath: '_id' }).createIndex('deckIndex', 'deck_id')
    }

    request.onsuccess = () => {
      console.log(request.result)
      resolve(request.result)
    }

    request.onerror = () => {
      console.error(request.error)
      reject(request.error)
    }
  })

  return dbPromise
}

export default {
  async getAllDecks(): Promise<Deck[]> {
    const db = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('decks')
      const store = transaction.objectStore('decks')
      const request = store.getAll()

      request.onsuccess = () => {
        console.log(request.result)
        resolve(deserializeDates(request.result))
      }

      request.onerror = () => {
        console.error(request.error)
        reject(request.error)
      }
    })
  },

  async createDeck(deck: Deck): Promise<Deck> {
    const db = await getDB()
    const serializedDeck = serializeDates(deck)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('decks', 'readwrite')
      const store = transaction.objectStore('decks')
      const request = store.add(serializedDeck)

      request.onsuccess = () => {
        console.log(deck)
        resolve(deck)
      }

      request.onerror = () => {
        console.error(request.error)
        reject(request.error)
      }
    })
  },

  async updateDeck(deck: Deck): Promise<Deck> {
    const db = await getDB()
    const serializedDeck = serializeDates(deck)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('decks', 'readwrite')
      const store = transaction.objectStore('decks')
      const request = store.put(serializedDeck)

      request.onsuccess = () => {
        console.log(deck)
        resolve(deck)
      }

      request.onerror = () => {
        console.error(request.error)
        reject(request.error)
      }
    })
  },

  async deleteDeck(deckId: string): Promise<void> {
    const db = await getDB()

    const cardsToDelete = await this.getAllCardsFromDeck(deckId)
    
    for (const card of cardsToDelete) {
      await this.deleteCard(card._id)
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('decks', 'readwrite')
      const store = transaction.objectStore('decks')
      const request = store.delete(deckId)

      request.onsuccess = () => {
        console.log(request.result)
        resolve(request.result)
      }

      request.onerror = () => {
        console.error(request.error)
        reject(request.error)
      }
    })
  },

  async getCardCounts(): Promise<CardCounts> {
    const cards = await this.getAllCards()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const cardCounts: CardCounts = {}

    for (const card of cards) {
      const cardDue = new Date(card.due)
      cardDue.setHours(0, 0, 0, 0)

      if (cardDue <= today) {
        if (!cardCounts[card.deck_id]) {
          cardCounts[card.deck_id] = { old: 0, new: 0 }
        }

        if (card.reps > 0) {
          cardCounts[card.deck_id].old++
        } else {
          cardCounts[card.deck_id].new++
        }
      }
    }

    return cardCounts
  },

  async getAllCards(): Promise<Card[]> {
    const db = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cards')
      const store = transaction.objectStore('cards')
      const request = store.getAll()

      request.onsuccess = () => {
        const deserializedCards = deserializeDates(request.result)
        resolve(deserializedCards)
      }

      request.onerror = () => {
        reject(request.error)
      }
    })
  },

  async getAllCardsFromDeck(deckId: string): Promise<Card[]> {
    const db = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cards')
      const store = transaction.objectStore('cards')
      const index = store.index('deckIndex')
      const request = index.getAll(deckId)

      request.onsuccess = () => {
        console.log(request.result)
        resolve(deserializeDates(request.result))
      }

      request.onerror = () => {
        console.error(request.error)
        reject(request.error)
      }
    })
  },

  async getCard(cardId: string): Promise<Card> {
    const db = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cards')
      const store = transaction.objectStore('cards')
      const request = store.get(cardId)

      request.onsuccess = () => {
        console.log(request.result)
        resolve(deserializeDates(request.result))
      }

      request.onerror = () => {
        console.error(request.error)
        reject(request.error)
      }
    })
  },

  async createCard(card: Card): Promise<Card> {
    const db = await getDB()
    const serializedCard = serializeDates(card)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cards', 'readwrite')
      const store = transaction.objectStore('cards')
      const request = store.add(serializedCard)

      request.onsuccess = () => {
        console.log(card)
        resolve(card)
      }

      request.onerror = () => {
        console.error(request.error)
        reject(request.error)
      }
    })
  },

  async updateCard(card: Card): Promise<Card> {
    const db = await getDB()
    const serializedCard = serializeDates(card)

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cards', 'readwrite')
      const store = transaction.objectStore('cards')
      const request = store.put(serializedCard)

      request.onsuccess = () => {
        console.log(card)
        resolve(card)
      }

      request.onerror = () => {
        console.error(request.error)
        reject(request.error)
      }
    })
  },

  async deleteCard(cardId: string): Promise<void> {
    const db = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cards', 'readwrite')
      const store = transaction.objectStore('cards')
      const request = store.delete(cardId)

      request.onsuccess = () => {
        console.log(request.result)
        resolve(request.result)
      }

      request.onerror = () => {
        console.error(request.error)
        reject(request.error)
      }
    })
  },
}
