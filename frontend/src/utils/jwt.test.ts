import { describe, expect, it } from 'vitest'
import { decodeJwt, isTokenExpired } from './jwt'

function base64url(texto: string): string {
  const bytes = new TextEncoder().encode(texto)
  let binario = ''
  bytes.forEach((byte) => {
    binario += String.fromCharCode(byte)
  })
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function crearToken(payload: Record<string, unknown>): string {
  return `${base64url('{"alg":"HS256","typ":"JWT"}')}.${base64url(JSON.stringify(payload))}.firma-simulada`
}

describe('decodeJwt', () => {
  it('decodifica los claims emitidos por ms-usuarios', () => {
    const token = crearToken({
      sub: 'ana@correo.cl',
      id: 42,
      rol: 'cliente',
      nombre: 'Ana Pérez',
      iss: 'bioforjarc-ms-usuarios',
      exp: 1893456000,
    })

    expect(decodeJwt(token)).toMatchObject({
      sub: 'ana@correo.cl',
      id: 42,
      rol: 'cliente',
      nombre: 'Ana Pérez',
      iss: 'bioforjarc-ms-usuarios',
    })
  })

  it('devuelve null para tokens ausentes o mal formados', () => {
    expect(decodeJwt(null)).toBeNull()
    expect(decodeJwt('')).toBeNull()
    expect(decodeJwt('sin-puntos')).toBeNull()
    expect(decodeJwt('a.b.c')).toBeNull()
    expect(decodeJwt('cabecera..firma')).toBeNull()
  })

  it('devuelve null si el payload no es un objeto JSON', () => {
    expect(decodeJwt(`cabecera.${base64url('"texto"')}.firma`)).toBeNull()
    expect(decodeJwt(`cabecera.${base64url('[1,2]')}.firma`)).toBeNull()
  })
})

describe('isTokenExpired', () => {
  it('considera expirado un token ausente', () => {
    expect(isTokenExpired(null)).toBe(true)
    expect(isTokenExpired(undefined)).toBe(true)
  })

  it('detecta tokens vencidos y vigentes', () => {
    const ahora = Math.floor(Date.now() / 1000)
    expect(isTokenExpired(crearToken({ exp: ahora - 60 }))).toBe(true)
    expect(isTokenExpired(crearToken({ exp: ahora + 3600 }))).toBe(false)
  })

  it('aplica un margen de expiración anticipada', () => {
    const ahora = Math.floor(Date.now() / 1000)
    const token = crearToken({ exp: ahora + 30 })

    expect(isTokenExpired(token)).toBe(false)
    expect(isTokenExpired(token, 60)).toBe(true)
  })

  it('deja pasar tokens sin claim exp o ilegibles para que el backend decida', () => {
    expect(isTokenExpired(crearToken({ sub: 'ana@correo.cl' }))).toBe(false)
    expect(isTokenExpired('token-ilegible')).toBe(false)
  })
})
