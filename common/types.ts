enum State {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

type FSRSCard = {
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: State;
  last_review?: Date;
};

export type Card = FSRSCard & {
  _id: string;
  deck_id: string;
  created: Date;
  updated: Date;
  front: string;
  back: string;
  images: Record<string, string>;
};

export type Deck = {
  _id: string;
  created: Date;
  updated: Date;
  name: string;
  type: "local" | "cloud";
};

export type Attachment = {
  _id: string;
  created: Date;
  content: string;
};

export type CardCounts = Record<string, { new: number; old: number }>;

export type PublicDeck = {
  _id: string;
  name: string;
  downloads: number;
  cards: number;
};

export type PublicCard = {
  _id: string;
  deck_id: string;
  front: string;
  back: string;
  images: Record<string, string>;
};
