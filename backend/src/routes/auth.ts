import { Hono } from 'hono'
import { usersCollection, sessionsCollection } from '../db'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'

export const auth = new Hono()

auth.post('/login', async (c) => {
  const { username, password } = await c.req.json()

  const user = await usersCollection.findOne({ username })

  if (!user) {
    return c.json({ error: 'Неверные учётные данные' }, 401)
  }

  const passwordValid = await Bun.password.verify(password, user.password)

  if (!passwordValid) {
    return c.json({ error: 'Неверные учётные данные' }, 401)
  }

  const sessionId = crypto.randomUUID()

  const session = {
    _id: sessionId,
    user_id: user._id,
    created: new Date(),
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  }

  await sessionsCollection.insertOne(session)

  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    secure: true,
  })

  return c.json({ message: 'Авторизация прошла успешно' })
})

auth.post('/signup', async (c) => {
  const { username, password } = await c.req.json()

  const existingUser = await usersCollection.findOne({ username })

  if (existingUser) {
    return c.json({ error: 'Пользователь уже существует' }, 400)
  }

  const hashedPassword = await Bun.password.hash(password)

  const userId = crypto.randomUUID()

  const newUser = { _id: userId, created: new Date(), username, password: hashedPassword }

  await usersCollection.insertOne(newUser)

  const sessionId = crypto.randomUUID()

  const session = {
    _id: sessionId,
    user_id: userId,
    created: new Date(),
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  }

  await sessionsCollection.insertOne(session)

  setCookie(c, 'session', sessionId, {
    httpOnly: true,
    secure: true,
  })

  return c.json({ message: 'Пользователь успешно создан' }, 201)
})

auth.post('/logout', async (c) => {
  const session = getCookie(c, 'session')

  await sessionsCollection.deleteOne({ _id: session })

  deleteCookie(c, 'session')

  return c.json({ message: 'Сессия окончена' }, 200)
})
