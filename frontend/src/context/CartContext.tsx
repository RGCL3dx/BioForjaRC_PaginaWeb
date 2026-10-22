import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { ProductoResumen } from '../types/api'

export interface CartItem {
  producto: ProductoResumen
  cantidad: number
}

interface CartContextValue {
  items: CartItem[]
  cantidadTotal: number
  subtotal: number
  agregar: (producto: ProductoResumen, cantidad?: number) => void
  actualizarCantidad: (productoId: number, cantidad: number) => void
  eliminar: (productoId: number) => void
  vaciar: () => void
  actualizarProducto: (producto: ProductoResumen) => void
}

const CART_KEY = 'bioforja_carrito'
const CartContext = createContext<CartContextValue | null>(null)

function leerCarrito(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as CartItem[]
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (item) =>
        item &&
        typeof item.cantidad === 'number' &&
        item.cantidad > 0 &&
        item.producto &&
        typeof item.producto.id === 'number',
    )
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => leerCarrito())

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  const agregar = useCallback((producto: ProductoResumen, cantidad = 1) => {
    setItems((actuales) => {
      const existente = actuales.find((item) => item.producto.id === producto.id)
      if (existente) {
        const nuevaCantidad = Math.min(producto.stock, existente.cantidad + cantidad)
        return actuales.map((item) =>
          item.producto.id === producto.id
            ? { producto: { ...producto }, cantidad: nuevaCantidad }
            : item,
        )
      }
      return [...actuales, { producto: { ...producto }, cantidad: Math.max(1, Math.min(producto.stock, cantidad)) }]
    })
  }, [])

  const actualizarCantidad = useCallback((productoId: number, cantidad: number) => {
    setItems((actuales) =>
      actuales.map((item) => {
        if (item.producto.id !== productoId) return item
        const max = Math.max(1, item.producto.stock)
        return { ...item, cantidad: Math.min(max, Math.max(1, Math.floor(cantidad))) }
      }),
    )
  }, [])

  const eliminar = useCallback((productoId: number) => {
    setItems((actuales) => actuales.filter((item) => item.producto.id !== productoId))
  }, [])

  const vaciar = useCallback(() => setItems([]), [])

  const actualizarProducto = useCallback((producto: ProductoResumen) => {
    setItems((actuales) =>
      actuales.map((item) =>
        item.producto.id === producto.id
          ? {
              producto,
              cantidad: Math.min(item.cantidad, Math.max(1, producto.stock)),
            }
          : item,
      ),
    )
  }, [])

  const cantidadTotal = useMemo(
    () => items.reduce((total, item) => total + item.cantidad, 0),
    [items],
  )

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + Number(item.producto.precio) * item.cantidad, 0),
    [items],
  )

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      cantidadTotal,
      subtotal,
      agregar,
      actualizarCantidad,
      eliminar,
      vaciar,
      actualizarProducto,
    }),
    [items, cantidadTotal, subtotal, agregar, actualizarCantidad, eliminar, vaciar, actualizarProducto],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart debe usarse dentro de CartProvider')
  return context
}
