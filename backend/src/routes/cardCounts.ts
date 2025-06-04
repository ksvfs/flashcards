import { Hono } from 'hono'
import { cardsCollection, decksCollection } from '../db'
import { authMiddleware } from '../middleware'
import type { CardCounts } from '../../../common/types'

type Variables = {
  user_id: string
}

export const cardCounts = new Hono<{ Variables: Variables }>()

function ensureDateObject(dateValue: Date | string): Date {
  if (dateValue instanceof Date) {
    return dateValue
  }
  return new Date(dateValue)
}

cardCounts.use('/card-counts', authMiddleware)

cardCounts.get('/card-counts', async (c) => {
  try {
    const userId = c.get('user_id')

    const userDecks = await decksCollection.find({ user_id: userId }).toArray()
    const userDeckIds = userDecks.map((deck) => deck._id)

    const allCards = await cardsCollection
      .find({
        deck_id: { $in: userDeckIds },
      })
      .toArray()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const cardCounts: CardCounts = {}

    for (const card of allCards) {
      const cardDue = ensureDateObject(card.due)
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

    return c.json(cardCounts)
  } catch (error) {
    return c.json({ error: 'Ошибка получения количества карточек' }, 500)
  }
})
