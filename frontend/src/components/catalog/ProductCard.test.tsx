import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { ProductoResumen } from '../../types/api'
import { ProductCard } from './ProductCard'

function producto(overrides: Partial<ProductoResumen> = {}): ProductoResumen {
  return {
    id: 3,
    nombre: 'Macetero hexagonal',
    descripcion: 'Impreso con PET reciclado.',
    precio: 12990,
    stock: 4,
    stockBajo: false,
    categoria: { id: 1, nombre: 'Maceteros', slug: 'maceteros' },
    imagen: 'imagenes/macetero.webp',
    activo: true,
    ...overrides,
  }
}

function renderizar(productoDatos: ProductoResumen, onAgregar = vi.fn()) {
  render(
    <MemoryRouter>
      <ProductCard producto={productoDatos} onAgregar={onAgregar} />
    </MemoryRouter>,
  )
  return onAgregar
}

describe('ProductCard', () => {
  it('muestra nombre, precio, stock e imagen normalizada', () => {
    renderizar(producto())

    expect(screen.getByRole('heading', { name: 'Macetero hexagonal' })).toBeInTheDocument()
    expect(screen.getByText('$12.990')).toBeInTheDocument()
    expect(screen.getByText('Quedan 4 unidades')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Macetero hexagonal' })).toHaveAttribute(
      'src',
      '/assets/imagenes/macetero.webp',
    )
  })

  it('llama a onAgregar con el producto seleccionado', () => {
    const onAgregar = renderizar(producto())

    fireEvent.click(screen.getByRole('button', { name: /Agregar al carrito/ }))

    expect(onAgregar).toHaveBeenCalledTimes(1)
    expect(onAgregar).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }))
  })

  it('deshabilita la compra cuando no hay stock', () => {
    renderizar(producto({ stock: 0 }))

    expect(screen.getByText('Agotado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Agregar al carrito/ })).toBeDisabled()
  })

  it('enlaza al detalle y a la cotización del producto', () => {
    renderizar(producto())

    const enlaces = screen.getAllByRole('link')
    expect(enlaces.some((enlace) => enlace.getAttribute('href') === '/productos/3')).toBe(true)
    expect(
      enlaces.some(
        (enlace) => enlace.getAttribute('href') === '/cotizacion?producto=Macetero%20hexagonal',
      ),
    ).toBe(true)
  })
})
