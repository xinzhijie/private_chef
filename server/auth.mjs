import jwt from 'jsonwebtoken'
import { queryOne } from './db.mjs'

export const TOKEN_COOKIE = 'auth_token'
export const TOKEN_MAX_AGE_MS = 8 * 60 * 60 * 1000
const JWT_SECRET = process.env.JWT_SECRET || 'private-chef-jwt-secret'

export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function setAuthCookie(res, user) {
  res.cookie(TOKEN_COOKIE, signToken(user), {
    httpOnly: true,
    maxAge: TOKEN_MAX_AGE_MS,
    sameSite: 'lax',
    path: '/'
  })
}

export function clearAuthCookie(res) {
  res.clearCookie(TOKEN_COOKIE, { path: '/' })
}

export function getAuthUser(req) {
  const token = req.cookies?.[TOKEN_COOKIE]
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload?.id) return null

  return queryOne('SELECT id, username, role FROM users WHERE id = ?', [payload.id])
}

export function isTokenExpired(req) {
  const token = req.cookies?.[TOKEN_COOKIE]
  if (!token) return false
  return !verifyToken(token)
}
