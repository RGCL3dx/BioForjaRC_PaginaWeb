import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../services/http'
import { RegistroPage } from './RegistroPage'

const mocks = vi.hoisted(() => ({
  registrar: vi.fn(),
  mostrar: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ usuario: null, registrar: mocks.registrar }),
}))

vi.mock('../context/NotificationContext', () => ({
  useNotification: () => ({ mostrar: mocks.mostrar }),
}))

beforeEach(() => {
  mocks.registrar.mockReset()
  mocks.mostrar.mockReset()
})

function renderizarRegistro() {
  render(
    <MemoryRouter>
      <RegistroPage />
    </MemoryRouter>,
  )
}

function completarFormulario({
  correo = 'ana@correo.cl',
  clave = 'Prueba1234',
  confirmarClave = clave,
}: {
  correo?: string
  clave?: string
  confirmarClave?: string
} = {}) {
  fireEvent.change(screen.getByLabelText(/^Nombre/), { target: { value: 'Ana' } })
  fireEvent.change(screen.getByLabelText(/^Apellido/), { target: { value: 'Pérez' } })
  fireEvent.change(screen.getByLabelText(/^RUT/), { target: { value: '12.345.678-9' } })
  fireEvent.change(screen.getByLabelText(/^Correo electrónico/), { target: { value: correo } })
  fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { value: clave } })
  fireEvent.change(screen.getByLabelText(/^Confirmar contraseña/), {
    target: { value: confirmarClave },
  })
}

describe('RegistroPage', () => {
  it('muestra validaciones cuando el formulario está vacío', () => {
    renderizarRegistro()

    fireEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))

    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('Usa el formato 12.345.678-9')).toBeInTheDocument()
    expect(screen.getByText('Debes aceptar los términos para registrarte')).toBeInTheDocument()
    expect(mocks.registrar).not.toHaveBeenCalled()
  })

  it('rechaza una contraseña que no cumple la política', () => {
    renderizarRegistro()
    completarFormulario({ clave: 'debil123' })
    fireEvent.click(screen.getByLabelText(/^Acepto los términos/))

    fireEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))

    expect(
      screen.getByText('Debe incluir mayúscula, minúscula y número'),
    ).toBeInTheDocument()
    expect(mocks.registrar).not.toHaveBeenCalled()
  })

  it('muestra el error del backend cuando el correo ya está registrado', async () => {
    mocks.registrar.mockRejectedValue(new ApiError(409, 'El correo ya está registrado'))
    renderizarRegistro()
    completarFormulario()
    fireEvent.click(screen.getByLabelText(/^Acepto los términos/))

    fireEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El correo ya está registrado')
  })

  it('envía los datos normalizados y notifica el registro exitoso', async () => {
    mocks.registrar.mockResolvedValue({ id: 4, nombre: 'Ana', rol: 'cliente' })
    renderizarRegistro()
    completarFormulario({ correo: '  ana@correo.cl  ' })
    fireEvent.click(screen.getByLabelText(/^Acepto los términos/))

    fireEvent.click(screen.getByRole('button', { name: 'Crear mi cuenta' }))

    await waitFor(() => {
      expect(mocks.registrar).toHaveBeenCalledWith({
        nombre: 'Ana',
        apellido: 'Pérez',
        rut: '12.345.678-9',
        correo: 'ana@correo.cl',
        telefono: undefined,
        clave: 'Prueba1234',
      })
    })
    expect(mocks.mostrar).toHaveBeenCalledWith('Cuenta creada. ¡Bienvenido(a), Ana!', 'success')
  })
})
