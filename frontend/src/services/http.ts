import type { ErrorResponse } from '../types/api'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8090').replace(/\/$/, '')
export const TOKEN_KEY = 'bioforja_token'
export const USER_KEY = 'bioforja_usuario'

export class ApiError extends Error {
  status: number
  details?: Record<string, string>

  constructor(status: number, message: string, details?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearSessionStorage(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function buildQuery(params: Record<string, string | number | boolean | undefined | null | string[]>): string {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.filter(Boolean).forEach((item) => query.append(key, item))
      return
    }
    query.append(key, String(value))
  })
  const text = query.toString()
  return text ? `?${text}` : ''
}

async function parseError(response: Response): Promise<ApiError> {
  let body: Partial<ErrorResponse> | null
  try {
    body = (await response.json()) as Partial<ErrorResponse>
  } catch {
    body = null
  }
  const message =
    body?.mensaje ||
    (response.status === 0 ? 'No se pudo conectar con el servidor' : `Error HTTP ${response.status}`)
  return new ApiError(response.status, message, body?.detalles)
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body = options.body
  if (body && !(body instanceof FormData) && typeof body !== 'string') {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      body: body as BodyInit | null | undefined,
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el API Gateway. Verifica que los servicios estén iniciados.')
  }

  if (!response.ok) {
    const error = await parseError(response)
    if (response.status === 401 && token && !path.startsWith('/api/auth/login')) {
      clearSessionStorage()
      window.dispatchEvent(new Event('bioforja:session-expired'))
    }
    throw error
  }

  if (response.status === 204) return undefined as T
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return (await response.text()) as T
  return (await response.json()) as T
}

function filenameFromDisposition(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8?.[1]) return decodeURIComponent(utf8[1])
  const simple = disposition.match(/filename="?([^";]+)"?/i)
  return simple?.[1] ?? fallback
}

export async function download(path: string, fallbackName: string): Promise<void> {
  const headers = new Headers()
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { headers })
  } catch {
    throw new ApiError(0, 'No se pudo descargar el archivo')
  }

  if (!response.ok) throw await parseError(response)
  const blob = await response.blob()
  const name = filenameFromDisposition(response.headers.get('content-disposition'), fallbackName)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
