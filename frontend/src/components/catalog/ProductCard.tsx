import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ProductoResumen } from '../../types/api'
import { assetUrl, formatCLP } from '../../utils/format'

interface ProductCardProps {
  producto: ProductoResumen
  onAgregar: (producto: ProductoResumen) => void
}

export function ProductCard({ producto, onAgregar }: ProductCardProps) {
  const agotado = producto.stock <= 0
  return (
    <Card className="group h-full gap-0 overflow-hidden rounded-2xl border-border/80 py-0 transition-shadow hover:shadow-lg">
      <Link to={`/productos/${producto.id}`} className="block overflow-hidden">
        <img
          className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          src={assetUrl(producto.imagen)}
          alt={producto.nombre}
          loading="lazy"
        />
      </Link>
      <CardContent className="flex flex-1 flex-col gap-2 p-5 text-center">
        <Link to={`/productos/${producto.id}`}>
          <h3 className="line-clamp-1 text-lg font-bold text-brand-dark transition-colors hover:text-primary">
            {producto.nombre}
          </h3>
        </Link>
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{producto.descripcion}</p>
        <p className="font-display text-lg font-bold text-ink">{formatCLP(producto.precio)}</p>
        <Badge variant={agotado ? 'destructive' : 'success'} className="mx-auto">
          {agotado ? 'Agotado' : `Quedan ${producto.stock} unidades`}
        </Badge>
        <div className="mt-auto flex flex-col gap-2 pt-2">
          <Button type="button" onClick={() => onAgregar(producto)} disabled={agotado}>
            <ShoppingCart className="size-4" aria-hidden="true" />
            Agregar al carrito
          </Button>
          <Button asChild variant="outline">
            <Link to={`/cotizacion?producto=${encodeURIComponent(producto.nombre)}`}>Cotizar</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
