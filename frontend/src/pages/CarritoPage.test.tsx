import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '../context/AuthContext'
import { CartProvider } from '../context/CartContext'
import { NotificationProvider } from '../context/NotificationContext'
import type { ProductoResumen } from '../types/api'
import { CarritoPage } from './CarritoPage'

const producto: ProductoResumen = {
  id: 1,
  nombre: 'Macetero circular',
  descripcion: 'Macetero impreso en 3D.',
  precio: 7990,
  stock: 5,
  stockBajo: false,
  categoria: { id: 1, nombre: 'Maceteros', slug: 'maceteros' },
  imagen: '/assets/imagenes/macetero-1.webp',
  activo: true,
}

function renderizarCarrito() {
  render(
    <MemoryRouter>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <CarritoPage />
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  localStorage.setItem(
    'bioforja_carrito',
    JSON.stringify([{ producto, cantidad: 2 }]),
  )
})

describe('CarritoPage', () => {
  it('aumenta y disminuye la cantidad con botones y recalcula el subtotal', () => {
    renderizarCarrito()

    const cantidad = screen.getByLabelText('Cantidad de Macetero circular')
    expect(cantidad).toHaveValue(2)
    expect(screen.getAllByText('$15.980').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Aumentar cantidad de Macetero circular' }))
    expect(cantidad).toHaveValue(3)
    expect(screen.getAllByText('$23.970').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: 'Disminuir cantidad de Macetero circular' }))
    expect(cantidad).toHaveValue(2)
  })

  it('deshabilita los controles cuando llega a los límites de stock', () => {
    renderizarCarrito()

    const disminuir = screen.getByRole('button', {
      name: 'Disminuir cantidad de Macetero circular',
    })
    const aumentar = screen.getByRole('button', {
      name: 'Aumentar cantidad de Macetero circular',
    })

    fireEvent.click(disminuir)
    expect(disminuir).toBeDisabled()

    fireEvent.click(aumentar)
    fireEvent.click(aumentar)
    fireEvent.click(aumentar)
    fireEvent.click(aumentar)
    expect(aumentar).toBeDisabled()
  })

  it('pide confirmación antes de quitar un producto', () => {
    renderizarCarrito()

    fireEvent.click(screen.getByRole('button', { name: 'Quitar Macetero circular' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Quitar producto' })).toBeInTheDocument()
    expect(screen.getByText(/¿Quitar/)).toHaveTextContent('Macetero circular')

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Cantidad de Macetero circular')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Quitar Macetero circular' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar' }))

    expect(screen.getByRole('heading', { name: 'Tu carrito está vacío' })).toBeInTheDocument()
  })
})
