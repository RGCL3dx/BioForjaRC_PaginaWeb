import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '../../types/api'
import { RequireAdmin, RequireAuth } from './Guards'

const mocks = vi.hoisted(() => ({
  auth: {
    usuario: null as Usuario | null,
    cargando: false,
    esAdmin: false,
  },
}))

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mocks.auth,
}))

const cliente: Usuario = {
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
}

function renderizarRutas(initialEntry: string) {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/privado" element={<div>Contenido privado</div>} />
        </Route>
        <Route element={<RequireAdmin />}>
          <Route path="/admin" element={<div>Panel admin</div>} />
        </Route>
        <Route path="/login" element={<div>Pantalla de login</div>} />
        <Route path="/" element={<div>Inicio público</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  mocks.auth = { usuario: null, cargando: false, esAdmin: false }
})

describe('Guards', () => {
  it('redirige al login cuando no hay sesión', () => {
    renderizarRutas('/privado')
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
  })

  it('bloquea el panel admin para un cliente', () => {
    mocks.auth = { usuario: cliente, cargando: false, esAdmin: false }
    renderizarRutas('/admin')
    expect(screen.getByText('Inicio público')).toBeInTheDocument()
  })

  it('permite el panel admin al administrador', () => {
    mocks.auth = {
      usuario: { ...cliente, rol: 'administrador' },
      cargando: false,
      esAdmin: true,
    }
    renderizarRutas('/admin')
    expect(screen.getByText('Panel admin')).toBeInTheDocument()
  })
})
