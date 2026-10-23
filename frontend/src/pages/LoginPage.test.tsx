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

describe('LoginPage', () => {
  it('muestra un error visible cuando las credenciales son inválidas', async () => {
    mocks.login.mockRejectedValue(new ApiError(401, 'Credenciales inválidas'))
    renderizarLogin()

    fireEvent.change(screen.getByLabelText(/^Correo electrónico/), {
      target: { value: 'ana@correo.cl' },
    })
    fireEvent.change(screen.getByLabelText(/^Contraseña/), {
      target: { value: 'clave-incorrecta' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas')
    expect(mocks.login).toHaveBeenCalledWith('ana@correo.cl', 'clave-incorrecta')
  })

  it('notifica al usuario cuando el login es exitoso', async () => {
    mocks.login.mockResolvedValue({ id: 4, nombre: 'Ana', rol: 'cliente' })
    renderizarLogin()

    fireEvent.change(screen.getByLabelText(/^Correo electrónico/), {
      target: { value: 'ana@correo.cl' },
    })
    fireEvent.change(screen.getByLabelText(/^Contraseña/), {
      target: { value: 'Prueba1234' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(mocks.mostrar).toHaveBeenCalledWith('Bienvenido(a), Ana', 'success')
    })
  })
})
