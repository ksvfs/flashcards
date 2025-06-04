import { Context, MiddlewareHandler, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { sessionsCollection } from '../db'

export const authMiddleware: MiddlewareHandler = async (c: Context, next: Next) => {
  const sessionId = getCookie(c, 'session')

  if (!sessionId) {
    return c.json({ error: 'Пользователь не авторизован' }, 401)
  }

  const session = await sessionsCollection.findOne({ _id: sessionId })

  if (!session) {
    return c.json({ error: 'Пользователь не авторизован' }, 401)
  }

  if (new Date() > new Date(session.expires)) {
    await sessionsCollection.deleteOne({ _id: sessionId })
    return c.json({ error: 'Сессия закончилась' }, 401)
  }

  c.set('user_id', session.user_id)

  await next()
}
