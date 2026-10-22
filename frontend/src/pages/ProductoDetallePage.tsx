import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ProductCard } from '../components/catalog/ProductCard'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { Loading } from '../components/common/Loading'
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
      <section className="py-5">
        <div className="container">
          <Loading texto="Cargando producto..." />
        </div>
      </section>
    )
  }

  if (error || !producto) {
    return (
      <section className="py-5">
        <div className="container">
          <ErrorAlert error={error ?? new Error('No encontramos el producto solicitado')} />
          <div className="text-center">
            <Link to="/productos" className="btn btn-marca rounded-pill">
              Volver al catálogo
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const sinStock = producto.stock <= 0

  return (
    <>
      <section className="py-4">
        <div className="container">
          <nav aria-label="Ruta de navegación">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <Link to="/">Inicio</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to="/productos">Productos</Link>
              </li>
              <li className="breadcrumb-item">
                <Link to={`/productos?categorias=${encodeURIComponent(producto.categoria.slug)}`}>
                  {producto.categoria.nombre}
                </Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                {producto.nombre}
              </li>
            </ol>
          </nav>
        </div>
      </section>

      <section className="pb-5">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm overflow-hidden rounded-4">
                <img
                  src={assetUrl(imagenSeleccionada)}
                  alt={producto.nombre}
                  className="w-100"
                  style={{ maxHeight: '520px', objectFit: 'cover' }}
                />
              </div>
              {galeria.length > 1 && (
                <div className="d-flex flex-wrap gap-2 mt-3" role="group" aria-label="Galería de imágenes">
                  {galeria.map((imagen) => (
                    <button
                      key={imagen}
                      type="button"
                      className={`btn p-0 border rounded-3 overflow-hidden ${
                        imagen === imagenSeleccionada ? 'border-3 border-success' : ''
                      }`}
                      style={{ width: '90px', height: '90px' }}
                      onClick={() => setImagenSeleccionada(imagen)}
                      aria-label={`Ver imagen de ${producto.nombre}`}
                    >
                      <img
                        src={assetUrl(imagen)}
                        alt=""
                        width={90}
                        height={90}
                        style={{ objectFit: 'cover' }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="col-lg-6">
              <span className="badge text-bg-light border mb-2">{producto.categoria.nombre}</span>
              <h1 className="h2">{producto.nombre}</h1>
              <p className="texto-gris">{producto.descripcion}</p>
              <p className="fs-2 fw-bold texto-marca mb-1">{formatCLP(producto.precio)}</p>
              <p className={`stock-producto ${sinStock ? 'agotado' : ''}`}>
                {sinStock
                  ? 'Producto agotado'
                  : `Disponible: ${producto.stock} unidad${producto.stock === 1 ? '' : 'es'}`}
              </p>

              {producto.stockBajo && !sinStock && (
                <div className="alert alert-warning py-2">
                  Quedan pocas unidades de este producto.
                </div>
              )}

              <dl className="row small mt-4">
                <dt className="col-sm-4 texto-gris">Material</dt>
                <dd className="col-sm-8">{producto.material || 'Plástico PET reciclado'}</dd>
                <dt className="col-sm-4 texto-gris">Dimensiones</dt>
                <dd className="col-sm-8">{producto.dimensiones || 'Consultar por medidas exactas'}</dd>
                <dt className="col-sm-4 texto-gris">Categoría</dt>
                <dd className="col-sm-8">{producto.categoria.nombre}</dd>
                <dt className="col-sm-4 texto-gris">Código</dt>
                <dd className="col-sm-8">BF-{String(producto.id).padStart(4, '0')}</dd>
              </dl>

              {!sinStock && (
                <div className="d-flex flex-wrap align-items-end gap-3 mt-4">
                  <div>
                    <label htmlFor="cantidad-producto" className="form-label">
                      Cantidad
                    </label>
                    <input
                      id="cantidad-producto"
                      type="number"
                      className="form-control"
                      min={1}
                      max={producto.stock}
                      value={cantidad}
                      onChange={(event) =>
                        setCantidad(
                          Math.max(1, Math.min(producto.stock, Number(event.target.value) || 1)),
                        )
                      }
                      style={{ maxWidth: '120px' }}
                    />
                  </div>
                  <button type="button" className="btn btn-marca btn-lg rounded-pill px-4" onClick={agregarAlCarrito}>
                    <i className="bi bi-cart-plus me-2" aria-hidden="true" />
                    Agregar al carrito
                  </button>
                </div>
              )}

              <div className="d-flex flex-wrap gap-2 mt-3">
                <Link
                  to={`/cotizacion?producto=${encodeURIComponent(producto.nombre)}`}
                  className="btn btn-marca-outline rounded-pill px-4"
                >
                  Cotizar este producto
                </Link>
                <Link to="/productos" className="btn btn-outline-secondary rounded-pill px-4">
                  Seguir explorando
                </Link>
              </div>

              <div className="alert alert-light border mt-4 mb-0 small">
                <i className="bi bi-recycle me-2 texto-marca" aria-hidden="true" />
                Fabricado con plástico reciclado. Cada compra ayuda a reducir residuos.
              </div>
            </div>
          </div>
        </div>
      </section>

      {relacionados.length > 0 && (
        <section className="py-5 seccion-clara">
          <div className="container">
            <h2 className="titulo-seccion">También te puede interesar</h2>
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
              {relacionados.map((item) => (
                <div className="col" key={item.id}>
                  <ProductCard producto={item} onAgregar={agregarRelacionado} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
