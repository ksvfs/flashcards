import type { Card as FSRSCard } from 'ts-fsrs'

export type { FSRSCard }

export type Card = FSRSCard & {
  _id: string
  deckId: string
  front: string
  back: string
}

export type Deck = {
  _id: string
  name: string
}
