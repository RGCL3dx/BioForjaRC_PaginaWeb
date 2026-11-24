import type { Rol } from '../types/api'

export interface JwtPayload {
  sub?: string
  id?: number
  rol?: Rol
  nombre?: string
  iss?: string
  iat?: number
  exp?: number
}

/**
 * Decodifica el payload de un JWT sin validar la firma.
 * La firma y la expiración real las valida el backend en cada solicitud.
 */
export function decodeJwt(token: string | null | undefined): JwtPayload | null {
  if (!token) return null
  const partes = token.split('.')
  if (partes.length !== 3 || !partes[1]) return null

  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/')
    const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
    const binario = atob(base64 + relleno)
    const bytes = Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0))
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as unknown
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null
    return payload as JwtPayload
  } catch {
    return null
  }
}

/**
 * Indica si el token ya expiró. Un token ilegible o sin claim `exp` se deja
 * pasar para que el backend decida; un token ausente siempre está expirado.
 */
export function isTokenExpired(token: string | null | undefined, margenSegundos = 0): boolean {
  if (!token) return true
  const payload = decodeJwt(token)
  if (!payload || typeof payload.exp !== 'number') return false
  return payload.exp * 1000 <= Date.now() + margenSegundos * 1000
}
