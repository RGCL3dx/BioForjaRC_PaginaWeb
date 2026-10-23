import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductList } from '../components/catalog/ProductList'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { Loading } from '../components/common/Loading'
import { Pagination } from '../components/common/Pagination'
import { useCart } from '../context/CartContext'
import { useNotification } from '../context/NotificationContext'
import { catalogoService } from '../services/catalogo'
import type { Categoria, PaginaResponse, ProductoResumen } from '../types/api'

const TAMANO_PAGINA = 12

export function ProductosPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categoriasDisponibles, setCategoriasDisponibles] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<PaginaResponse<ProductoResumen> | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [errorCategorias, setErrorCategorias] = useState<unknown>(null)
  const { agregar } = useCart()
  const { mostrar } = useNotification()

  const q = searchParams.get('q') ?? ''
  const material = searchParams.get('material') ?? ''
  const pagina = Math.max(0, Number(searchParams.get('pagina') ?? '0') || 0)
  const categorias = useMemo(() => searchParams.getAll('categorias'), [searchParams])
  const [busqueda, setBusqueda] = useState(q)
  const [materialInput, setMaterialInput] = useState(material)

  useEffect(() => {
    setBusqueda(q)
  }, [q])

  useEffect(() => {
    setMaterialInput(material)
  }, [material])

  useEffect(() => {
    let activo = true
    catalogoService
      .listarCategorias()
      .then((lista) => {
        if (activo) setCategoriasDisponibles(lista)
      })
      .catch((err: unknown) => {
        if (activo) setErrorCategorias(err)
      })
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    if (busqueda.trim() === q) return
    const temporizador = window.setTimeout(() => {
      setSearchParams((previos) => {
        const siguientes = new URLSearchParams(previos)
        if (busqueda.trim()) siguientes.set('q', busqueda.trim())
        else siguientes.delete('q')
        siguientes.delete('pagina')
        return siguientes
      }, { replace: true })
    }, 350)
    return () => window.clearTimeout(temporizador)
  }, [busqueda, q, setSearchParams])

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError(null)
    catalogoService
      .listarProductos({
        q: q || undefined,
        categorias,
        material: material || undefined,
        pagina,
        tamano: TAMANO_PAGINA,
      })
      .then((respuesta) => {
        if (activo) setProductos(respuesta)
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
  }, [q, categorias, material, pagina])

  const cambiarParametros = (cambios: {
    q?: string
    categorias?: string[]
    material?: string
    pagina?: number
  }) => {
    setSearchParams((previos) => {
      const siguientes = new URLSearchParams(previos)
      if (cambios.q !== undefined) {
        if (cambios.q.trim()) siguientes.set('q', cambios.q.trim())
        else siguientes.delete('q')
      }
      if (cambios.categorias !== undefined) {
        siguientes.delete('categorias')
        cambios.categorias.forEach((categoria) => siguientes.append('categorias', categoria))
      }
      if (cambios.material !== undefined) {
        if (cambios.material.trim()) siguientes.set('material', cambios.material.trim())
        else siguientes.delete('material')
      }
      if (cambios.pagina !== undefined) {
        if (cambios.pagina > 0) siguientes.set('pagina', String(cambios.pagina))
        else siguientes.delete('pagina')
      } else {
        siguientes.delete('pagina')
      }
      return siguientes
    })
  }

  const alternarCategoria = (slug: string) => {
    const nuevas = categorias.includes(slug)
      ? categorias.filter((item) => item !== slug)
      : [...categorias, slug]
    cambiarParametros({ categorias: nuevas })
  }

  const aplicarBusqueda = (event: FormEvent) => {
    event.preventDefault()
    cambiarParametros({ q: busqueda })
  }

  const limpiarFiltros = () => {
    setBusqueda('')
    setMaterialInput('')
    setSearchParams({})
  }

  const agregarAlCarrito = (producto: ProductoResumen) => {
    agregar(producto, 1)
    mostrar(`${producto.nombre} se agregó al carrito`, 'success')
  }

  const hayFiltros = Boolean(q || material || categorias.length > 0)

  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="titulo-seccion">Catálogo de productos</h1>
          <p className="pagina-intro">
            Explora nuestra línea ecológica creada con plástico PET reciclado e impresión 3D.
          </p>
        </div>
      </section>

      <section className="py-4">
        <div className="container-xl">
          <div className="card card-formulario p-3 p-md-4 mb-4">
            <form className="row g-2 align-items-end" onSubmit={aplicarBusqueda}>
              <div className="col-lg-5">
                <label htmlFor="buscar-producto" className="form-label">
                  Buscar en el catálogo
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search" aria-hidden="true" />
                  </span>
                  <input
                    id="buscar-producto"
                    type="search"
                    className="form-control"
                    placeholder="Nombre o descripción del producto"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                  />
                </div>
              </div>
              <div className="col-lg-4">
                <label htmlFor="filtrar-material" className="form-label">
                  Material
                </label>
                <input
                  id="filtrar-material"
                  type="search"
                  className="form-control"
                  placeholder="Ej: PET reciclado"
                  value={materialInput}
                  onChange={(event) => setMaterialInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      cambiarParametros({ material: materialInput })
                    }
                  }}
                />
              </div>
              <div className="col-lg-3 d-flex gap-2">
                <button type="submit" className="btn btn-marca rounded-pill flex-grow-1">
                  Buscar
                </button>
                <button
                  type="button"
                  className="btn btn-marca-outline rounded-pill"
                  onClick={limpiarFiltros}
                  disabled={!hayFiltros}
                >
                  Limpiar
                </button>
              </div>
            </form>

            {categoriasDisponibles.length > 0 && (
              <div className="mt-3 pt-3 border-top">
                <span className="small fw-bold text-uppercase texto-gris me-2">Categorías:</span>
                <div className="d-inline-flex flex-wrap gap-2 mt-1">
                  {categoriasDisponibles.map((categoria) => {
                    const activa = categorias.includes(categoria.slug)
                    return (
                      <button
                        key={categoria.id}
                        type="button"
                        className={`btn btn-sm rounded-pill ${
                          activa ? 'btn-marca' : 'btn-marca-outline'
                        }`}
                        aria-pressed={activa}
                        onClick={() => alternarCategoria(categoria.slug)}
                      >
                        {categoria.nombre}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
            {Boolean(errorCategorias) && (
              <div className="mt-3">
                <ErrorAlert error={errorCategorias} />
              </div>
            )}
          </div>

          {hayFiltros && (
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <span className="texto-gris small">Filtros activos:</span>
              {q && <span className="badge text-bg-light border">Búsqueda: {q}</span>}
              {material && <span className="badge text-bg-light border">Material: {material}</span>}
              {categorias.map((categoria) => (
                <span className="badge text-bg-light border" key={categoria}>
                  {categoriasDisponibles.find((item) => item.slug === categoria)?.nombre ?? categoria}
                </span>
              ))}
            </div>
          )}

          {Boolean(error) && <ErrorAlert error={error} />}

          {cargando ? (
            <Loading texto="Cargando catálogo..." />
          ) : !productos || productos.contenido.length === 0 ? (
            <EmptyState
              titulo="No encontramos productos"
              descripcion="Prueba con otra búsqueda o quita algunos filtros."
              accion={
                hayFiltros ? (
                  <button type="button" className="btn btn-marca rounded-pill" onClick={limpiarFiltros}>
                    Ver todos los productos
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                <p className="texto-gris mb-0">
                  {productos.totalElementos} producto{productos.totalElementos === 1 ? '' : 's'} encontrado
                  {productos.totalElementos === 1 ? '' : 's'}
                </p>
                <p className="texto-gris mb-0">
                  Página {productos.totalPaginas === 0 ? 0 : productos.pagina + 1} de{' '}
                  {productos.totalPaginas}
                </p>
              </div>
              <ProductList productos={productos.contenido} onAgregar={agregarAlCarrito} />
              <Pagination
                pagina={productos.pagina}
                totalPaginas={productos.totalPaginas}
                onChange={(nuevaPagina) => cambiarParametros({ pagina: nuevaPagina })}
              />
            </>
          )}
        </div>
      </section>
    </>
  )
}
