import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../services/http'
import { LoginPage } from './LoginPage'

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  mostrar: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ usuario: null, login: mocks.login, esAdmin: false }),
}))

vi.mock('../context/NotificationContext', () => ({
  useNotification: () => ({ mostrar: mocks.mostrar }),
}))

beforeEach(() => {
  mocks.login.mockReset()
  mocks.mostrar.mockReset()
})

function renderizarLogin() {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

function completarCredenciales(correo: string, clave: string) {
  fireEvent.change(screen.getByLabelText(/^Correo electrónico/), {
    target: { value: correo },
  })
  fireEvent.change(screen.getByLabelText(/^Contraseña/), {
    target: { value: clave },
  })
}

describe('LoginPage', () => {
  it('muestra un error visible cuando las credenciales son inválidas', async () => {
    mocks.login.mockRejectedValue(new ApiError(401, 'Credenciales inválidas'))
    renderizarLogin()

    completarCredenciales('ana@correo.cl', 'clave-incorrecta')
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
    expect(mocks.login).toHaveBeenCalledWith('ana@correo.cl', 'clave-incorrecta')
  })

  it('notifica al usuario cuando el login es exitoso', async () => {
    mocks.login.mockResolvedValue({ id: 4, nombre: 'Ana', rol: 'cliente' })
    renderizarLogin()

    completarCredenciales('ana@correo.cl', 'Prueba1234')
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(mocks.mostrar).toHaveBeenCalledWith('Bienvenido(a), Ana', 'success')
    })
  })

  it('permite mostrar y ocultar la contraseña', () => {
    renderizarLogin()

    const clave = screen.getByLabelText(/^Contraseña/)
    expect(clave).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(clave).toHaveAttribute('type', 'text')

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(clave).toHaveAttribute('type', 'password')
  })
})
