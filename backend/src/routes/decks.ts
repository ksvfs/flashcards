import { Hono } from 'hono'
import { decksCollection, cardsCollection } from '../db'
import { authMiddleware } from '../middleware'

type Variables = {
  user_id: string
}

export const decks = new Hono<{ Variables: Variables }>()

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

decks.use('/decks', authMiddleware)

decks.get('/decks', async (c) => {
  try {
    const userId = c.get('user_id')
    const userDecks = await decksCollection.find({ user_id: userId }).toArray()
    return c.json(userDecks)
  } catch (error) {
    return c.json({ error: 'Ошибка получения колод' }, 500)
  }
})

decks.post('/decks', async (c) => {
  try {
    const rawDeck = await c.req.json()
    const deck = deserializeDates(rawDeck)
    const userId = c.get('user_id')

    deck.user_id = userId

    await decksCollection.insertOne(deck)
    return c.json(deck, 201)
  } catch (error) {
    return c.json({ error: 'Ошибка при создании колоды' }, 500)
  }
})

decks.put('/decks', async (c) => {
  try {
    const rawDeck = await c.req.json()
    const deck = deserializeDates(rawDeck)
    const userId = c.get('user_id')

    const existingDeck = await decksCollection.findOne({ _id: deck._id })

    if (!existingDeck) {
      return c.json({ error: 'Колода не найдена' }, 404)
    }

    if (existingDeck.user_id !== userId) {
      return c.json({ error: 'Пользователь не авторизован' }, 403)
    }

    deck.user_id = userId

    await decksCollection.replaceOne({ _id: deck._id }, deck)
    return c.json(deck)
  } catch (error) {
    return c.json({ error: 'Ошибка при редактировании колоды' }, 500)
  }
})

decks.delete('/decks/:deckId', async (c) => {
  try {
    const deckId = c.req.param('deckId')
    const userId = c.get('user_id')

    const deck = await decksCollection.findOne({ _id: deckId })

    if (!deck) {
      return c.json({ error: 'Колода не найдена' }, 404)
    }

    if (deck.user_id !== userId) {
      return c.json({ error: 'Пользователь не авторизован' }, 403)
    }

    await cardsCollection.deleteMany({ deck_id: deckId })

    await decksCollection.deleteOne({ _id: deckId })
    return c.json({ message: 'Колода успешно удалена' })
  } catch (error) {
    return c.json({ error: 'Ошибка при удалении колоды' }, 500)
  }
})
