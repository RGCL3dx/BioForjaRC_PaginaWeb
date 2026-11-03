import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronRight, Recycle, ShoppingCart } from 'lucide-react'
import { ProductList } from '../components/catalog/ProductList'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { Loading } from '../components/common/Loading'
import { Alert } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { useCart } from '../context/CartContext'
import { useNotification } from '../context/NotificationContext'
import { catalogoService } from '../services/catalogo'
import type { ProductoDetalle, ProductoResumen } from '../types/api'
import { assetUrl, formatCLP } from '../utils/format'

export function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [producto, setProducto] = useState<ProductoDetalle | null>(null)
  const [relacionados, setRelacionados] = useState<ProductoResumen[]>([])
  const [imagenSeleccionada, setImagenSeleccionada] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const { agregar } = useCart()
  const { mostrar } = useNotification()

  useEffect(() => {
    const productoId = Number(id)
    if (!Number.isFinite(productoId) || productoId <= 0) {
      setError(new Error('El producto solicitado no es válido'))
      setCargando(false)
      return
    }

    let activo = true
    setCargando(true)
    setError(null)
    catalogoService
      .obtenerProducto(productoId)
      .then((detalle) => {
        if (!activo) return
        setProducto(detalle)
        setCantidad(1)
        const galeria = [detalle.imagen, ...(detalle.imagenes ?? [])].filter(
          (imagen, indice, lista) => Boolean(imagen) && lista.indexOf(imagen) === indice,
        )
        setImagenSeleccionada(galeria[0] ?? '')
        return catalogoService
          .listarProductos({ categorias: [detalle.categoria.slug], tamano: 5 })
          .then((pagina) => {
            if (activo) {
              setRelacionados(pagina.contenido.filter((item) => item.id !== detalle.id).slice(0, 4))
            }
          })
          .catch(() => {
            if (activo) setRelacionados([])
          })
      })
      .catch((err: unknown) => {
        if (activo) setError(err)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [id])

  const galeria = useMemo(() => {
    if (!producto) return []
    return [producto.imagen, ...(producto.imagenes ?? [])].filter(
      (imagen, indice, lista) => Boolean(imagen) && lista.indexOf(imagen) === indice,
    )
  }, [producto])

  const agregarAlCarrito = () => {
    if (!producto) return
    agregar(producto, cantidad)
    mostrar(`${cantidad} × ${producto.nombre} se agregó al carrito`, 'success')
  }

  const agregarRelacionado = (item: ProductoResumen) => {
    agregar(item, 1)
    mostrar(`${item.nombre} se agregó al carrito`, 'success')
  }

  if (cargando) {
    return (
      <section className="py-12">
        <div className="container-page">
          <Loading texto="Cargando producto..." />
        </div>
      </section>
    )
  }

  if (error || !producto) {
    return (
      <section className="py-12">
        <div className="container-page">
          <ErrorAlert error={error ?? new Error('No encontramos el producto solicitado')} />
          <div className="text-center">
            <Button asChild>
              <Link to="/productos">Volver al catálogo</Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  const sinStock = producto.stock <= 0

  return (
    <>
      <section className="pt-6">
        <div className="container-page">
          <nav aria-label="Ruta de navegación">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary">
                  Inicio
                </Link>
              </li>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <li>
                <Link to="/productos" className="hover:text-primary">
                  Productos
                </Link>
              </li>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <li>
                <Link
                  to={`/productos?categorias=${encodeURIComponent(producto.categoria.slug)}`}
                  className="hover:text-primary"
                >
                  {producto.categoria.nombre}
                </Link>
              </li>
              <ChevronRight className="size-3.5" aria-hidden="true" />
              <li className="font-semibold text-foreground" aria-current="page">
                {producto.nombre}
              </li>
            </ol>
          </nav>
        </div>
      </section>

      <section className="py-8">
        <div className="container-page grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <Card className="overflow-hidden rounded-2xl py-0">
              <img
                src={assetUrl(imagenSeleccionada)}
                alt={producto.nombre}
                className="max-h-[520px] w-full object-cover"
              />
            </Card>
            {galeria.length > 1 && (
              <div
                className="mt-3 flex flex-wrap gap-2"
                role="group"
                aria-label="Galería de imágenes"
              >
                {galeria.map((imagen) => (
                  <button
                    key={imagen}
                    type="button"
                    className={`size-20 overflow-hidden rounded-xl border-2 transition-colors ${
                      imagen === imagenSeleccionada
                        ? 'border-primary'
                        : 'border-border hover:border-brand-light'
                    }`}
                    onClick={() => setImagenSeleccionada(imagen)}
                    aria-label={`Ver imagen de ${producto.nombre}`}
                  >
                    <img
                      src={assetUrl(imagen)}
                      alt=""
                      width={90}
                      height={90}
                      className="size-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Badge variant="secondary" className="mb-3">
              {producto.categoria.nombre}
            </Badge>
            <h1 className="text-3xl font-extrabold text-brand-dark">{producto.nombre}</h1>
            <p className="mt-3 text-muted-foreground">{producto.descripcion}</p>
            <p className="mt-4 font-display text-3xl font-extrabold text-primary">
              {formatCLP(producto.precio)}
            </p>
            <p className={`mt-1 text-sm font-semibold ${sinStock ? 'text-destructive' : 'text-brand'}`}>
              {sinStock
                ? 'Producto agotado'
                : `Disponible: ${producto.stock} unidad${producto.stock === 1 ? '' : 'es'}`}
            </p>

            {producto.stockBajo && !sinStock && (
              <Alert variant="warning" className="mt-4">
                Quedan pocas unidades de este producto.
              </Alert>
            )}

            <dl className="mt-6 grid grid-cols-[9rem_1fr] gap-y-2 text-sm">
              <dt className="text-muted-foreground">Material</dt>
              <dd>{producto.material || 'Plástico PET reciclado'}</dd>
              <dt className="text-muted-foreground">Dimensiones</dt>
              <dd>{producto.dimensiones || 'Consultar por medidas exactas'}</dd>
              <dt className="text-muted-foreground">Categoría</dt>
              <dd>{producto.categoria.nombre}</dd>
              <dt className="text-muted-foreground">Código</dt>
              <dd>BF-{String(producto.id).padStart(4, '0')}</dd>
            </dl>

            {!sinStock && (
              <div className="mt-6 flex flex-wrap items-end gap-3">
                <div>
                  <Label htmlFor="cantidad-producto">Cantidad</Label>
                  <Input
                    id="cantidad-producto"
                    type="number"
                    className="w-28"
                    min={1}
                    max={producto.stock}
                    value={cantidad}
                    onChange={(event) =>
                      setCantidad(
                        Math.max(1, Math.min(producto.stock, Number(event.target.value) || 1)),
                      )
                    }
                  />
                </div>
                <Button size="lg" onClick={agregarAlCarrito}>
                  <ShoppingCart className="size-4" aria-hidden="true" />
                  Agregar al carrito
                </Button>
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to={`/cotizacion?producto=${encodeURIComponent(producto.nombre)}`}>
                  Cotizar este producto
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/productos">Seguir explorando</Link>
              </Button>
            </div>

            <Alert variant="brand" className="mt-6 text-sm">
              <Recycle aria-hidden="true" />
              Fabricado con plástico reciclado. Cada compra ayuda a reducir residuos.
            </Alert>
          </div>
        </div>
      </section>

      {relacionados.length > 0 && (
        <section className="bg-white/60 py-12">
          <div className="container-page">
            <h2 className="section-title">También te puede interesar</h2>
            <ProductList productos={relacionados} onAgregar={agregarRelacionado} columnas={4} />
          </div>
        </section>
      )}
    </>
  )
}
