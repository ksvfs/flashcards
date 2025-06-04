import type {
  Deck as CommonDeck,
  Card as CommonCard,
  Attachment as CommonAttachment,
  PublicDeck as CommonPublicDeck,
  PublicCard as CommonPublicCard,
} from '../../common/types'

export type Deck = CommonDeck & { user_id: string }

export type Card = CommonCard

export type Attachment = CommonAttachment & { user_id: string }

export type User = {
  _id: string
  created: Date
  username: string
  password: string
}

export type Session = {
  _id: string
  user_id: string
  created: Date
  expires: Date
}

export type PublicDeck = Omit<CommonPublicDeck, 'cards' | 'downloads'> & {
  cards?: number
  downloads?: number
}

export type PublicCard = CommonPublicCard
