import type { ProductoResumen } from '../../types/api'
import { ProductCard } from './ProductCard'

interface ProductListProps {
  productos: ProductoResumen[]
  onAgregar: (producto: ProductoResumen) => void
  columnas?: 3 | 4
}

export function ProductList({ productos, onAgregar, columnas = 4 }: ProductListProps) {
  return (
    <div
      className={
        columnas === 3
          ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'
          : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }
    >
      {productos.map((producto) => (
        <ProductCard key={producto.id} producto={producto} onAgregar={onAgregar} />
      ))}
    </div>
  )
}
