import { Hono } from 'hono'
import { decksCollection, cardsCollection } from '../db'
import { authMiddleware } from '../middleware'
import { Card } from '../types'

type Variables = {
  user_id: string
}

export const convert = new Hono<{ Variables: Variables }>()

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

convert.use('/convert', authMiddleware)

convert.post('/convert', async (c) => {
  try {
    const userId = c.get('user_id')

    const rawPayload = await c.req.json()
    const { deck, cards } = deserializeDates(rawPayload)

    deck.user_id = userId

    await decksCollection.deleteOne({ _id: deck._id })

    deck.type = 'cloud'

    await decksCollection.insertOne(deck)

    if (cards.length > 0) {
      await cardsCollection.deleteMany({ deck_id: deck._id })

      const bulkOps = cards.map((card: Card) => ({
        updateOne: {
          filter: { _id: card._id },
          update: { $set: card },
          upsert: true,
        },
      }))

      await cardsCollection.bulkWrite(bulkOps)
    }

    return c.json({ message: 'Конвертация прошла успешно' }, 201)
  } catch (error) {
    return c.json({ error: 'Ошибка при конвертации' }, 500)
  }
})
