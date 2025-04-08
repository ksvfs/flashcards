import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { initDB } from './db'

const app = new Hono()

app.use('*', cors())

const { decks, cards } = await initDB()

app.get('/decks', async (c) => {
  const allDecks = await decks.find().toArray()
  return c.json(allDecks)
})

app.post('/decks', async (c) => {
  const deck = await c.req.json()
  await decks.insertOne(deck)
  return c.json(deck)
})

app.get('/cards', async (c) => {
  const allCards = await cards.find().toArray()
  return c.json(allCards)
})

app.get('/decks/:deckId/cards', async (c) => {
  const { deckId } = c.req.param()
  const deckCards = await cards.find({ deckId: deckId }).toArray()
  return c.json(deckCards)
})

app.get('/cards/:cardId', async (c) => {
  const { cardId } = c.req.param()
  const card = await cards.findOne({ _id: cardId })
  return c.json(card)
})

app.post('/cards', async (c) => {
  const card = await c.req.json()
  await cards.insertOne(card)
  return c.json(card)
})

app.put('/cards', async (c) => {
  const card = await c.req.json()
  await cards.replaceOne({ _id: card._id }, card)
  return c.json(card)
})

app.delete('/cards/:cardId', async (c) => {
  const { cardId } = c.req.param()
  await cards.findOneAndDelete({ _id: cardId })
  return c.status(200)
})

export default app
