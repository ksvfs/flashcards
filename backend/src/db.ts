import { MongoClient } from 'mongodb'
import type { Deck, Card, User, Session, PublicDeck, PublicCard } from './types'
import publicDecks from './data/publicDecks'
import publicCards from './data/publicCards'

const user = Bun.env.MONGO_USER
const pass = Bun.env.MONGO_PASS

const uri = `mongodb://${user}:${pass}@mongo:27017`
const client = new MongoClient(uri)
await client.connect()

const db = client.db('flashcards')
const decksCollection = db.collection<Deck>('decks')
const cardsCollection = db.collection<Card>('cards')
const usersCollection = db.collection<User>('users')
const sessionsCollection = db.collection<Session>('session')
const publicDecksCollection = db.collection<PublicDeck>('publicDecks')
const publicCardsCollection = db.collection<PublicCard>('publicCards')

await publicDecksCollection.deleteMany({})
await publicDecksCollection.insertMany(publicDecks)
await publicCardsCollection.deleteMany({})
await publicCardsCollection.insertMany(publicCards)

export {
  decksCollection,
  cardsCollection,
  usersCollection,
  sessionsCollection,
  publicDecksCollection,
  publicCardsCollection,
}
