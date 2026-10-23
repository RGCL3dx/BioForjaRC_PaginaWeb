import type { ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ProductoResumen } from '../types/api'
import { CartProvider, useCart } from './CartContext'

const CART_KEY = 'bioforja_carrito'

function producto(overrides: Partial<ProductoResumen> = {}): ProductoResumen {
  return {
    id: 1,
    nombre: 'Macetero circular',
    descripcion: 'Macetero impreso en 3D.',
    precio: 7990,
    stock: 5,
    stockBajo: false,
    categoria: { id: 1, nombre: 'Maceteros', slug: 'maceteros' },
    imagen: '/assets/imagenes/macetero-1.webp',
    activo: true,
    ...overrides,
  }
}

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>

function usarCarrito() {
  return renderHook(() => useCart(), { wrapper })
}

beforeEach(() => {
  localStorage.clear()
})

describe('CartContext', () => {
  it('agrega un producto y acumula cantidades sin superar el stock', () => {
    const { result } = usarCarrito()

    act(() => result.current.agregar(producto({ stock: 5 }), 2))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].cantidad).toBe(2)
    expect(result.current.cantidadTotal).toBe(2)

    act(() => result.current.agregar(producto({ stock: 5 }), 10))
    expect(result.current.items[0].cantidad).toBe(5)
    expect(result.current.cantidadTotal).toBe(5)
  })

  it('actualiza la cantidad, recalcula el subtotal y respeta los límites', () => {
    const { result } = usarCarrito()

    act(() => result.current.agregar(producto({ precio: 1000, stock: 5 }), 1))
    act(() => result.current.actualizarCantidad(1, 3))

    expect(result.current.items[0].cantidad).toBe(3)
    expect(result.current.subtotal).toBe(3000)

    act(() => result.current.actualizarCantidad(1, 99))
    expect(result.current.items[0].cantidad).toBe(5)

    act(() => result.current.actualizarCantidad(1, 0))
    expect(result.current.items[0].cantidad).toBe(1)

    act(() => result.current.actualizarCantidad(1, 2.9))
    expect(result.current.items[0].cantidad).toBe(2)
  })

  it('elimina un producto y vacía el carrito', () => {
    const { result } = usarCarrito()

    act(() => {
      result.current.agregar(producto({ id: 1 }), 1)
      result.current.agregar(producto({ id: 2, nombre: 'Figura articulada' }), 2)
    })
    expect(result.current.cantidadTotal).toBe(3)

    act(() => result.current.eliminar(1))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].producto.id).toBe(2)

    act(() => result.current.vaciar())
    expect(result.current.items).toEqual([])
    expect(result.current.subtotal).toBe(0)
  })

  it('actualiza el producto y ajusta la cantidad si baja el stock', () => {
    const { result } = usarCarrito()

    act(() => result.current.agregar(producto({ stock: 5 }), 4))
    act(() => result.current.actualizarProducto(producto({ stock: 2, precio: 9990 })))

    expect(result.current.items[0].cantidad).toBe(2)
    expect(result.current.items[0].producto.precio).toBe(9990)
    expect(result.current.subtotal).toBe(19980)
  })

  it('persiste el carrito y lo recupera desde localStorage', async () => {
    const { result, unmount } = usarCarrito()

    act(() => result.current.agregar(producto({ id: 7, nombre: 'Llavero PET' }), 2))

    await waitFor(() => {
      const guardado = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]') as unknown[]
      expect(guardado).toHaveLength(1)
    })

    unmount()
    const { result: recuperado } = usarCarrito()
    expect(recuperado.current.items[0].producto.id).toBe(7)
    expect(recuperado.current.items[0].cantidad).toBe(2)
  })

  it('ignora un carrito corrupto o con datos inválidos', () => {
    localStorage.setItem(CART_KEY, '{esto-no-es-json')
    const { result: corrupto } = usarCarrito()
    expect(corrupto.current.items).toEqual([])

    localStorage.setItem(
      CART_KEY,
      JSON.stringify([{ producto: { id: 'no-es-numero' }, cantidad: 1 }]),
    )
    const { result: invalido } = usarCarrito()
    expect(invalido.current.items).toEqual([])
  })
})
