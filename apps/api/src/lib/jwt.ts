import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../config/env'

export function signAccessToken(userId: string, email: string) {
  const options: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'] }
  return jwt.sign({ sub: userId, email }, env.JWT_ACCESS_SECRET, options)
}

export function signRefreshToken(userId: string, tokenId: string) {
  const options: SignOptions = { expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` }
  return jwt.sign({ sub: userId, jti: tokenId }, env.JWT_REFRESH_SECRET, options)
}

export function verifyAccessToken(token: string) {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET)
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw new Error('Token de acesso inválido.')
  }
  return { userId: decoded.sub }
}

export function verifyRefreshToken(token: string) {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET)
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string' || typeof decoded.jti !== 'string') {
    throw new Error('Token de atualização inválido.')
  }
  return { userId: decoded.sub, tokenId: decoded.jti, expiresAt: decoded.exp }
}
