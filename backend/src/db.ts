import { MongoClient } from 'mongodb'
import type { Deck, Card } from './types'

export async function initDB() {
  const user = Bun.env.MONGO_USER
  const pass = Bun.env.MONGO_PASS

  const uri = `mongodb://${user}:${pass}@mongo:27017`
  const client = new MongoClient(uri)
  await client.connect()

  const db = client.db('flashcards')
  const decks = db.collection<Deck>('decks')
  const cards = db.collection<Card>('cards')

  return { decks, cards }
}
