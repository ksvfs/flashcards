import { Hono } from 'hono'
import { auth } from './auth'
import { cardCounts } from './cardCounts'
import { cards } from './cards'
import { decks } from './decks'
import { convert } from './convert'
import { publicDecks } from './publicDecks'

const routes = new Hono()

routes.route('/', auth)
routes.route('/', cardCounts)
routes.route('/', cards)
routes.route('/', decks)
routes.route('/', convert)
routes.route('/', publicDecks)

export default routes
