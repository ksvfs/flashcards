declare enum State {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

type FSRSCard = {
  due: Date
  stability: number
  difficulty: number
  elapsed_days: number
  scheduled_days: number
  reps: number
  lapses: number
  state: State
  last_review?: Date
}

export type Card = FSRSCard & {
  _id: string
  deckId: string
  front: string
  back: string
}

export type Deck = {
  _id: string
  name: string
  type: 'local' | 'cloud'
}
