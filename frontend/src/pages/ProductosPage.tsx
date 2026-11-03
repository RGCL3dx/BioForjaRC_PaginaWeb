import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { ProductList } from '../components/catalog/ProductList'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { Loading } from '../components/common/Loading'
import { Pagination } from '../components/common/Pagination'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
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
      <section className="pt-10 pb-6">
        <div className="container-page text-center">
          <h1 className="section-title">Catálogo de productos</h1>
          <p className="page-intro mb-0">
            Explora nuestra línea ecológica creada con plástico PET reciclado e impresión 3D.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page">
          <Card className="mb-5 gap-0 p-4 sm:p-6">
            <form className="flex flex-col gap-4 lg:flex-row lg:items-end" onSubmit={aplicarBusqueda}>
              <div className="flex-1">
                <Label htmlFor="buscar-producto">Buscar en el catálogo</Label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="buscar-producto"
                    type="search"
                    className="pl-9"
                    placeholder="Nombre o descripción del producto"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1">
                <Label htmlFor="filtrar-material">Material</Label>
                <Input
                  id="filtrar-material"
                  type="search"
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
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 lg:flex-none">
                  <Search className="size-4" aria-hidden="true" />
                  Buscar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={limpiarFiltros}
                  disabled={!hayFiltros}
                >
                  <X className="size-4" aria-hidden="true" />
                  Limpiar
                </Button>
              </div>
            </form>

            {categoriasDisponibles.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                  <SlidersHorizontal className="size-3.5" aria-hidden="true" />
                  Categorías:
                </span>
                {categoriasDisponibles.map((categoria) => {
                  const activa = categorias.includes(categoria.slug)
                  return (
                    <Button
                      key={categoria.id}
                      type="button"
                      size="sm"
                      variant={activa ? 'default' : 'outline'}
                      aria-pressed={activa}
                      onClick={() => alternarCategoria(categoria.slug)}
                    >
                      {categoria.nombre}
                    </Button>
                  )
                })}
              </div>
            )}
            {Boolean(errorCategorias) && (
              <div className="mt-4">
                <ErrorAlert error={errorCategorias} />
              </div>
            )}
          </Card>

          {hayFiltros && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {q && <Badge variant="outline">Búsqueda: {q}</Badge>}
              {material && <Badge variant="outline">Material: {material}</Badge>}
              {categorias.map((categoria) => (
                <Badge variant="outline" key={categoria}>
                  {categoriasDisponibles.find((item) => item.slug === categoria)?.nombre ?? categoria}
                </Badge>
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
                  <Button type="button" onClick={limpiarFiltros}>
                    Ver todos los productos
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
                <p>
                  {productos.totalElementos} producto{productos.totalElementos === 1 ? '' : 's'}{' '}
                  encontrado{productos.totalElementos === 1 ? '' : 's'}
                </p>
                <p>
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
