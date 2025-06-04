import { Hono } from 'hono'
import { publicDecksCollection, publicCardsCollection } from '../db'

export const publicDecks = new Hono()

publicDecks.get('public-decks', async (c) => {
  const publicDecks = await publicDecksCollection.find().toArray()

  for (const deck of publicDecks) {
    deck.cards = await publicCardsCollection.countDocuments({ deck_id: deck._id })
    deck.downloads = deck.downloads ?? 0
  }

  return c.json(publicDecks)
})

publicDecks.get('public-decks/:deckId/cards', async (c) => {
  const deckId = c.req.param('deckId')

  const deck = await publicDecksCollection.findOne({ _id: deckId })

  if (!deck) {
    return c.json({ error: 'Публичная колода не найдена' }, 404)
  }

  await publicDecksCollection.updateOne({ _id: deckId }, { $inc: { downloads: 1 } })

  const cards = await publicCardsCollection.find({ deck_id: deckId }).toArray()

  return c.json(cards)
})
