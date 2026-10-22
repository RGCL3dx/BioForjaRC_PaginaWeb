import { Link } from 'react-router-dom'
import type { ProductoResumen } from '../../types/api'
import { assetUrl, formatCLP } from '../../utils/format'

interface ProductCardProps {
  producto: ProductoResumen
  onAgregar: (producto: ProductoResumen) => void
}

export function ProductCard({ producto, onAgregar }: ProductCardProps) {
  return (
    <article className="card card-producto h-100 border-0 shadow-sm">
      <Link to={`/productos/${producto.id}`} className="text-decoration-none">
        <img
          className="card-img-top"
          src={assetUrl(producto.imagen)}
          alt={producto.nombre}
          loading="lazy"
        />
      </Link>
      <div className="card-body d-flex flex-column text-center">
        <Link to={`/productos/${producto.id}`} className="text-decoration-none text-reset">
          <h3 className="card-title h5">{producto.nombre}</h3>
        </Link>
        <p className="card-text card-descripcion">{producto.descripcion}</p>
        <p className="card-text mb-1">
          <strong>{formatCLP(producto.precio)}</strong>
        </p>
        <p className={`stock-producto ${producto.stock > 0 ? '' : 'agotado'}`}>
          {producto.stock > 0 ? `Quedan ${producto.stock} unidades` : 'Agotado'}
        </p>
        <button
          type="button"
          className="btn btn-marca mt-auto mb-2"
          onClick={() => onAgregar(producto)}
          disabled={producto.stock <= 0}
        >
          Agregar al carrito
        </button>
        <Link to={`/cotizacion?producto=${encodeURIComponent(producto.nombre)}`} className="btn btn-marca-outline">
          Cotizar
        </Link>
      </div>
    </article>
  )
}
