import type { Card as FSRSCard } from 'ts-fsrs'

export type { FSRSCard }

export type Card = FSRSCard & {
  id: string
  deckId: string
  front: string
  back: string
}

export type Deck = {
  id: string
  name: string
}
