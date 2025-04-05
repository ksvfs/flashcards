import type { Deck, Card } from '@/types'

let dbPromise: Promise<IDBDatabase> | null = null

async function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('flashcards', 1)

    request.onupgradeneeded = () => {
      const db = request.result
      db.createObjectStore('decks', { keyPath: 'id' })
      db.createObjectStore('cards', { keyPath: 'id' }).createIndex('deckIndex', 'deckId')
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
        resolve(request.result)
      }

      request.onerror = () => {
        console.error(request.error)
        reject(request.error)
      }
    })
  },

  async createDeck(deck: Deck): Promise<Deck> {
    const db = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('decks', 'readwrite')
      const store = transaction.objectStore('decks')
      const request = store.add(deck)

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

  async getAllCards(): Promise<Card[]> {
    const db = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cards')
      const store = transaction.objectStore('cards')
      const request = store.getAll()

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

  async getAllCardsFromDeck(deckId: string): Promise<Card[]> {
    const db = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cards')
      const store = transaction.objectStore('cards')
      const index = store.index('deckIndex')
      const request = index.getAll(deckId)

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

  async getCard(cardId: string): Promise<Card> {
    const db = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cards')
      const store = transaction.objectStore('cards')
      const request = store.get(cardId)

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

  async createCard(card: Card): Promise<Card> {
    const db = await getDB()

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cards', 'readwrite')
      const store = transaction.objectStore('cards')
      const request = store.add(card)

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

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('cards', 'readwrite')
      const store = transaction.objectStore('cards')
      const request = store.put(card)

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
