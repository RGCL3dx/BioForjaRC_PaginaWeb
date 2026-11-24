import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  TOKEN_KEY,
  USER_KEY,
  buildQuery,
  clearSessionStorage,
  getToken,
  request,
  setToken,
} from './http'

function respuesta(
  body: unknown,
  { status = 200, contentType = 'application/json' }: { status?: number; contentType?: string } = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': contentType }),
    json: async () => body,
    text: async () => String(body),
  } as Response
}

function tokenConExpiracion(exp: number): string {
  const codificar = (valor: unknown) =>
    btoa(JSON.stringify(valor)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return `${codificar({ alg: 'HS256', typ: 'JWT' })}.${codificar({ sub: 'ana@correo.cl', exp })}.firma`
}

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('buildQuery', () => {
  it('serializa parámetros y omite valores vacíos', () => {
    expect(
      buildQuery({
        busqueda: 'macetero',
        pagina: 0,
        activo: false,
        categoria: ['maceteros', 'figuras'],
        vacio: '',
        nulo: null,
        indefinido: undefined,
      }),
    ).toBe('?busqueda=macetero&pagina=0&activo=false&categoria=maceteros&categoria=figuras')
  })

  it('devuelve una cadena vacía cuando no hay parámetros', () => {
    expect(buildQuery({})).toBe('')
  })
})

describe('almacenamiento del token', () => {
  it('guarda, lee y elimina la sesión', () => {
    setToken('token-de-prueba')
    localStorage.setItem(USER_KEY, JSON.stringify({ id: 1 }))

    expect(getToken()).toBe('token-de-prueba')

    clearSessionStorage()
    expect(getToken()).toBeNull()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe('request', () => {
  it('envía el token JWT y serializa el cuerpo JSON', async () => {
    setToken('jwt-abc')
    fetchMock.mockResolvedValue(respuesta({ id: 7 }))

    const resultado = await request<{ id: number }>('/api/pedidos', {
      method: 'POST',
      body: { productoId: 3 },
    })

    expect(resultado).toEqual({ id: 7 })
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = opciones.headers as Headers
    expect(url).toContain('/api/pedidos')
    expect(headers.get('Authorization')).toBe('Bearer jwt-abc')
    expect(headers.get('Content-Type')).toBe('application/json')
    expect(opciones.body).toBe('{"productoId":3}')
  })

  it('no agrega Authorization cuando no hay sesión', async () => {
    fetchMock.mockResolvedValue(respuesta([]))

    await request('/api/productos')

    const [, opciones] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((opciones.headers as Headers).get('Authorization')).toBeNull()
  })

  it('devuelve undefined en respuestas 204', async () => {
    fetchMock.mockResolvedValue(respuesta(null, { status: 204 }))

    await expect(request('/api/usuarios/1/direcciones/2', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('devuelve texto cuando la respuesta no es JSON', async () => {
    fetchMock.mockResolvedValue(respuesta('archivo,plano', { contentType: 'text/plain' }))

    await expect(request('/api/reportes/exportar')).resolves.toBe('archivo,plano')
  })

  it('convierte errores HTTP en ApiError con detalles', async () => {
    fetchMock.mockResolvedValue(
      respuesta(
        { mensaje: 'Datos inválidos', detalles: { correo: 'Ya está registrado' } },
        { status: 400 },
      ),
    )

    await expect(request('/api/auth/registro', { method: 'POST', body: {} })).rejects.toMatchObject({
      name: 'ApiError',
      status: 400,
      message: 'Datos inválidos',
      details: { correo: 'Ya está registrado' },
    })
  })

  it('informa un ApiError 0 cuando no hay conexión con el gateway', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(request('/api/productos')).rejects.toMatchObject({
      name: 'ApiError',
      status: 0,
    })
  })

  it('rechaza la solicitud sin llamar al gateway cuando el token ya expiró', async () => {
    setToken(tokenConExpiracion(Math.floor(Date.now() / 1000) - 60))
    const alExpirar = vi.fn()
    window.addEventListener('bioforja:session-expired', alExpirar)

    await expect(request('/api/usuarios/1')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: expect.stringContaining('expirado'),
    })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(getToken()).toBeNull()
    expect(alExpirar).toHaveBeenCalledTimes(1)
    window.removeEventListener('bioforja:session-expired', alExpirar)
  })

  it('limpia la sesión y notifica cuando el token expira (401)', async () => {
    setToken('jwt-expirado')
    localStorage.setItem(USER_KEY, JSON.stringify({ id: 1 }))
    fetchMock.mockResolvedValue(
      respuesta({ mensaje: 'No autenticado' }, { status: 401 }),
    )
    const alExpirar = vi.fn()
    window.addEventListener('bioforja:session-expired', alExpirar)

    await expect(request('/api/usuarios/1')).rejects.toBeInstanceOf(ApiError)

    expect(getToken()).toBeNull()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
    expect(alExpirar).toHaveBeenCalledTimes(1)
    window.removeEventListener('bioforja:session-expired', alExpirar)
  })
})
