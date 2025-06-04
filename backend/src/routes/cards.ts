import { Hono } from 'hono'
import { cardsCollection, decksCollection } from '../db'
import { authMiddleware } from '../middleware'

type Variables = {
  user_id: string
}

export const cards = new Hono<{ Variables: Variables }>()

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

cards.use('/cards', authMiddleware)

cards.get('/cards', async (c) => {
  try {
    const userId = c.get('user_id')

    const userDecks = await decksCollection.find({ user_id: userId }).toArray()
    const userDeckIds = userDecks.map((deck) => deck._id)

    const userCards = await cardsCollection
      .find({
        deck_id: { $in: userDeckIds },
      })
      .toArray()

    return c.json(userCards)
  } catch (error) {
    return c.json({ error: 'Ошибка получения карточек' }, 500)
  }
})

cards.use('/decks/:deckId/cards', authMiddleware)

cards.get('/decks/:deckId/cards', async (c) => {
  const { deckId } = c.req.param()
  const userId = c.get('user_id')

  const deck = await decksCollection.findOne({ _id: deckId })

  if (!deck) {
    return c.json({ error: 'Колода не найдена' }, 404)
  }

  if (deck.user_id !== userId) {
    return c.json({ error: 'Пользователь не авторизован' }, 403)
  }

  const deckCards = await cardsCollection.find({ deck_id: deckId }).toArray()

  return c.json(deckCards)
})

cards.use('/cards/:cardId', authMiddleware)

cards.get('/cards/:cardId', async (c) => {
  const { cardId } = c.req.param()
  const userId = c.get('user_id')

  const card = await cardsCollection.findOne({ _id: cardId })

  if (!card) {
    return c.json({ error: 'Карточка не найдена' }, 404)
  }

  const deck = await decksCollection.findOne({ _id: card.deck_id })

  if (!deck || deck.user_id !== userId) {
    return c.json({ error: 'Пользователь не авторизован' }, 403)
  }

  return c.json(card)
})

cards.post('/cards', async (c) => {
  try {
    const userId = c.get('user_id')
    const rawCard = await c.req.json()
    const card = deserializeDates(rawCard)

    const deck = await decksCollection.findOne({ _id: card.deck_id })

    if (!deck) {
      return c.json({ error: 'Колода не найдена' }, 404)
    }

    if (deck.user_id !== userId) {
      return c.json({ error: 'Пользователь не авторизован' }, 403)
    }

    await cardsCollection.insertOne(card)
    return c.json(card, 201)
  } catch (error) {
    return c.json({ error: 'Не удалось создать карточку' }, 500)
  }
})

cards.put('/cards', async (c) => {
  try {
    const userId = c.get('user_id')
    const rawCard = await c.req.json()
    const card = deserializeDates(rawCard)

    const existingCard = await cardsCollection.findOne({ _id: card._id })

    if (!existingCard) {
      return c.json({ error: 'Карточка не найдена' }, 404)
    }

    const deck = await decksCollection.findOne({ _id: card.deck_id })

    if (!deck) {
      return c.json({ error: 'Колода не найдена' }, 404)
    }

    if (deck.user_id !== userId) {
      return c.json({ error: 'Пользователь не авторизован' }, 403)
    }

    await cardsCollection.replaceOne({ _id: card._id }, card)
    return c.json(card)
  } catch (error) {
    return c.json({ error: 'Не удалось обновить карточку' }, 500)
  }
})

cards.delete('/cards/:cardId', async (c) => {
  try {
    const { cardId } = c.req.param()
    const userId = c.get('user_id')

    const card = await cardsCollection.findOne({ _id: cardId })

    if (!card) {
      return c.json({ error: 'Карточка не найдена' }, 404)
    }

    const deck = await decksCollection.findOne({ _id: card.deck_id })

    if (!deck) {
      return c.json({ error: 'Колода не найдена' }, 404)
    }

    if (deck.user_id !== userId) {
      return c.json({ error: 'Пользователь не авторизован' }, 403)
    }

    await cardsCollection.deleteOne({ _id: cardId })
    return c.json({ message: 'Карточка успешно удалена' }, 200)
  } catch (error) {
    return c.json({ error: 'Не удалось удалить карточку' }, 500)
  }
})
