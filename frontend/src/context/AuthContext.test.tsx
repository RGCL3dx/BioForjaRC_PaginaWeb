import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authService } from '../services/auth'
import { USER_KEY, TOKEN_KEY } from '../services/http'
import { usuarioService } from '../services/usuarios'
import type { LoginResponse, Usuario } from '../types/api'
import { AuthProvider, useAuth } from './AuthContext'

vi.mock('../services/auth', () => ({
  authService: {
    login: vi.fn(),
    registrar: vi.fn(),
  },
}))

vi.mock('../services/usuarios', () => ({
  usuarioService: {
    obtener: vi.fn(),
  },
}))

function base64url(texto: string): string {
  const bytes = new TextEncoder().encode(texto)
  let binario = ''
  bytes.forEach((byte) => {
    binario += String.fromCharCode(byte)
  })
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function crearToken(exp: number, rol: 'cliente' | 'administrador' = 'cliente'): string {
  const cabecera = base64url('{"alg":"HS256","typ":"JWT"}')
  const payload = base64url(
    JSON.stringify({
      sub: 'ana@correo.cl',
      id: 4,
      rol,
      nombre: 'Ana Pérez',
      iss: 'bioforjarc-ms-usuarios',
      exp,
    }),
  )
  return `${cabecera}.${payload}.firma-simulada`
}

function usuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: 4,
    nombre: 'Ana',
    apellido: 'Pérez',
    rut: '12.345.678-9',
    correo: 'ana@correo.cl',
    rol: 'cliente',
    estado: 'Activo',
    fechaRegistro: '2026-10-22',
    correoConfirmado: true,
    direcciones: [],
    ...overrides,
  }
}

function Sonda() {
  const { usuario: actual, token, esAdmin, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="token">{token ?? 'sin-token'}</span>
      <span data-testid="usuario">{actual?.correo ?? 'sin-usuario'}</span>
      <span data-testid="admin">{String(esAdmin)}</span>
      <button type="button" onClick={() => void login('ana@correo.cl', 'Clave1234')}>
        login
      </button>
      <button type="button" onClick={logout}>
        logout
      </button>
    </div>
  )
}

function renderizarSesion() {
  render(
    <AuthProvider>
      <Sonda />
    </AuthProvider>,
  )
}

function ahoraEnSegundos(): number {
  return Math.floor(Date.now() / 1000)
}

beforeEach(() => {
  localStorage.clear()
  vi.mocked(authService.login).mockReset()
  vi.mocked(usuarioService.obtener).mockReset()
})

describe('AuthContext y JWT', () => {
  it('descarta una sesión cuyo token ya expiró', () => {
    localStorage.setItem(TOKEN_KEY, crearToken(ahoraEnSegundos() - 60))
    localStorage.setItem(USER_KEY, JSON.stringify(usuario()))

    renderizarSesion()

    expect(screen.getByTestId('token')).toHaveTextContent('sin-token')
    expect(screen.getByTestId('usuario')).toHaveTextContent('sin-usuario')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
  })

  it('restaura una sesión vigente y refresca el usuario con el claim id', async () => {
    localStorage.setItem(TOKEN_KEY, crearToken(ahoraEnSegundos() + 3600))
    localStorage.setItem(USER_KEY, JSON.stringify(usuario()))
    vi.mocked(usuarioService.obtener).mockResolvedValue(
      usuario({ correo: 'actualizado@correo.cl' }),
    )

    renderizarSesion()

    expect(screen.getByTestId('token')).not.toHaveTextContent('sin-token')
    expect(await screen.findByText('actualizado@correo.cl')).toBeInTheDocument()
    expect(usuarioService.obtener).toHaveBeenCalledWith(4)
  })

  it('inicia sesión, persiste el token y expone el rol administrador', async () => {
    const respuesta: LoginResponse = {
      token: crearToken(ahoraEnSegundos() + 3600, 'administrador'),
      tipo: 'Bearer',
      expiraEn: 3600,
      usuario: usuario({ rol: 'administrador' }),
    }
    vi.mocked(authService.login).mockResolvedValue(respuesta)
    renderizarSesion()

    fireEvent.click(screen.getByRole('button', { name: 'login' }))

    await waitFor(() => {
      expect(screen.getByTestId('token')).toHaveTextContent(respuesta.token)
    })
    expect(screen.getByTestId('admin')).toHaveTextContent('true')
    expect(localStorage.getItem(TOKEN_KEY)).toBe(respuesta.token)
    expect(JSON.parse(localStorage.getItem(USER_KEY) ?? '{}')).toMatchObject({
      correo: 'ana@correo.cl',
    })
  })

  it('cierra sesión y limpia token y usuario del almacenamiento', async () => {
    localStorage.setItem(TOKEN_KEY, crearToken(ahoraEnSegundos() + 3600))
    localStorage.setItem(USER_KEY, JSON.stringify(usuario()))
    vi.mocked(usuarioService.obtener).mockResolvedValue(usuario())
    renderizarSesion()

    fireEvent.click(screen.getByRole('button', { name: 'logout' }))

    expect(screen.getByTestId('token')).toHaveTextContent('sin-token')
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
  })
})
