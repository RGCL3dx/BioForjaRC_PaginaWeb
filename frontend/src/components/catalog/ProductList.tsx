import type { ProductoResumen } from '../../types/api'
import { ProductCard } from './ProductCard'

interface ProductListProps {
  productos: ProductoResumen[]
  onAgregar: (producto: ProductoResumen) => void
  columnas?: string
}

const COLUMNAS_POR_DEFECTO = 'row-cols-1 row-cols-sm-2 row-cols-lg-3 row-cols-xl-4'

export function ProductList({
  productos,
  onAgregar,
  columnas = COLUMNAS_POR_DEFECTO,
}: ProductListProps) {
  return (
    <div className={`row g-4 ${columnas}`}>
      {productos.map((producto) => (
        <div className="col" key={producto.id}>
          <ProductCard producto={producto} onAgregar={onAgregar} />
        </div>
      ))}
    </div>
  )
}
