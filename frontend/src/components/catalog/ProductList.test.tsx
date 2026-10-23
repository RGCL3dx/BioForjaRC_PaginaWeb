import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { ProductoResumen } from '../../types/api'
import { ProductList } from './ProductList'

function producto(id: number, nombre: string): ProductoResumen {
  return {
    id,
    nombre,
    descripcion: `Descripción de ${nombre}`,
    precio: 1000 * id,
    stock: 3,
    stockBajo: true,
    categoria: { id: 1, nombre: 'Maceteros', slug: 'maceteros' },
    imagen: '/assets/imagenes/macetero-1.webp',
    activo: true,
  }
}

describe('ProductList', () => {
  it('compone una tarjeta por cada producto recibido', () => {
    render(
      <MemoryRouter>
        <ProductList
          productos={[producto(1, 'Macetero'), producto(2, 'Figura')]}
          onAgregar={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Macetero' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Figura' })).toBeInTheDocument()
  })

  it('no renderiza tarjetas cuando la lista está vacía', () => {
    const { container } = render(
      <MemoryRouter>
        <ProductList productos={[]} onAgregar={vi.fn()} />
      </MemoryRouter>,
    )

    expect(container.querySelectorAll('article')).toHaveLength(0)
  })
})
