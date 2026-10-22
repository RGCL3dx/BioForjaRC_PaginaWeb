import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { ProductoResumen } from '../../types/api'
import { ProductCard } from './ProductCard'

const producto: ProductoResumen = {
  id: 1,
  nombre: 'Macetero circular',
  descripcion: 'Macetero impreso en 3D con plástico reciclado.',
  precio: 7990,
  stock: 5,
  stockBajo: false,
  categoria: { id: 1, nombre: 'Maceteros', slug: 'maceteros' },
  imagen: '../assets/imagenes/macetero-1.webp',
  activo: true,
}

function renderizar(productoAMostrar: ProductoResumen, onAgregar = vi.fn()) {
  render(
    <MemoryRouter>
      <ProductCard producto={productoAMostrar} onAgregar={onAgregar} />
    </MemoryRouter>,
  )
  return onAgregar
}

describe('ProductCard', () => {
  it('muestra los datos del producto y enlaza al detalle', () => {
    renderizar(producto)
    expect(screen.getByRole('heading', { name: 'Macetero circular' })).toBeInTheDocument()
    expect(screen.getByText('Macetero impreso en 3D con plástico reciclado.')).toBeInTheDocument()
    expect(screen.getByText('Quedan 5 unidades')).toBeInTheDocument()
    const enlaces = screen.getAllByRole('link')
    expect(enlaces.some((enlace) => enlace.getAttribute('href') === '/productos/1')).toBe(true)
  })

  it('avisa al agregar un producto con stock', () => {
    const onAgregar = renderizar(producto)
    fireEvent.click(screen.getByRole('button', { name: 'Agregar al carrito' }))
    expect(onAgregar).toHaveBeenCalledWith(producto)
  })

  it('deshabilita la compra cuando no hay stock', () => {
    renderizar({ ...producto, stock: 0 })
    expect(screen.getByText('Agotado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar al carrito' })).toBeDisabled()
  })
})
