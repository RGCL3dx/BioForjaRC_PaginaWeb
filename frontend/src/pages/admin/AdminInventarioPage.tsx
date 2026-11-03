import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ImageIcon, Package, Plus, Search } from 'lucide-react'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorAlert, mensajeDeError } from '../../components/common/ErrorAlert'
import { Loading } from '../../components/common/Loading'
import { Pagination } from '../../components/common/Pagination'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'
import { Textarea } from '../../components/ui/textarea'
import { useNotification } from '../../context/NotificationContext'
import { catalogoService } from '../../services/catalogo'
import type {
  Categoria,
  PaginaResponse,
  ProductoRequest,
  ProductoResumen,
} from '../../types/api'
import { assetUrl, formatCLP, formatNumber } from '../../utils/format'
import { cn } from '@/lib/utils'

type FiltroActivo = 'todos' | 'activos' | 'inactivos'

interface FormularioProducto {
  nombre: string
  descripcion: string
  precio: string
  stock: string
  categoriaSlug: string
  material: string
  dimensiones: string
  imagen: string
  imagenes: string
}

const formularioInicial: FormularioProducto = {
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '0',
  categoriaSlug: '',
  material: 'Plástico PET reciclado',
  dimensiones: '',
  imagen: '',
  imagenes: '',
}

const selectClase =
  'flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-brand-light focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70'

export function AdminInventarioPage() {
  const { mostrar } = useNotification()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [productos, setProductos] = useState<PaginaResponse<ProductoResumen> | null>(null)
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [categoria, setCategoria] = useState('')
  const [filtroActivo, setFiltroActivo] = useState<FiltroActivo>('todos')
  const [pagina, setPagina] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [formulario, setFormulario] = useState<FormularioProducto>(formularioInicial)
  const [erroresFormulario, setErroresFormulario] = useState<Record<string, string>>({})
  const [errorFormulario, setErrorFormulario] = useState<unknown>(null)
  const [guardando, setGuardando] = useState(false)
  const [cargandoEdicion, setCargandoEdicion] = useState(false)

  const [productoEstado, setProductoEstado] = useState<ProductoResumen | null>(null)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  useEffect(() => {
    let activo = true
    catalogoService
      .listarCategorias()
      .then((lista) => {
        if (activo) setCategorias(lista)
      })
      .catch((err: unknown) => {
        if (activo) setError(err)
      })
    return () => {
      activo = false
    }
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const respuesta = await catalogoService.listarInventario({
        q: q || undefined,
        categorias: categoria ? [categoria] : undefined,
        activo:
          filtroActivo === 'todos' ? undefined : filtroActivo === 'activos',
        pagina,
        tamano: 10,
      })
      setProductos(respuesta)
    } catch (err: unknown) {
      setError(err)
    } finally {
      setCargando(false)
    }
  }, [q, categoria, filtroActivo, pagina])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const abrirNuevo = () => {
    setEditandoId(null)
    setFormulario({
      ...formularioInicial,
      categoriaSlug: categorias[0]?.slug ?? '',
    })
    setErroresFormulario({})
    setErrorFormulario(null)
    setModalAbierto(true)
  }

  const abrirEditar = async (producto: ProductoResumen) => {
    setEditandoId(producto.id)
    setErroresFormulario({})
    setErrorFormulario(null)
    setModalAbierto(true)
    setCargandoEdicion(true)
    try {
      const detalle = await catalogoService.obtenerInventario(producto.id)
      setFormulario({
        nombre: detalle.nombre,
        descripcion: detalle.descripcion,
        precio: String(detalle.precio),
        stock: String(detalle.stock),
        categoriaSlug: detalle.categoria.slug,
        material: detalle.material ?? '',
        dimensiones: detalle.dimensiones ?? '',
        imagen: detalle.imagen,
        imagenes: (detalle.imagenes ?? []).join('\n'),
      })
    } catch (err: unknown) {
      setErrorFormulario(err)
    } finally {
      setCargandoEdicion(false)
    }
  }

  const actualizar = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
  }

  const guardar = async (event: FormEvent) => {
    event.preventDefault()
    setErrorFormulario(null)
    const nuevos: Record<string, string> = {}
    if (!formulario.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio'
    if (!formulario.descripcion.trim()) nuevos.descripcion = 'La descripción es obligatoria'
    if (!formulario.precio || Number(formulario.precio) <= 0) {
      nuevos.precio = 'El precio debe ser mayor que cero'
    }
    if (formulario.stock === '' || Number(formulario.stock) < 0) {
      nuevos.stock = 'El stock no puede ser negativo'
    }
    if (!formulario.categoriaSlug) nuevos.categoriaSlug = 'Selecciona una categoría'
    if (!formulario.imagen.trim()) nuevos.imagen = 'La imagen principal es obligatoria'
    setErroresFormulario(nuevos)
    if (Object.keys(nuevos).length > 0) return

    const imagenes = formulario.imagenes
      .split('\n')
      .map((imagen) => imagen.trim())
      .filter(Boolean)
      .slice(0, 8)

    const datos: ProductoRequest = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim(),
      precio: Number(formulario.precio),
      stock: Number(formulario.stock),
      categoriaSlug: formulario.categoriaSlug,
      material: formulario.material.trim() || undefined,
      dimensiones: formulario.dimensiones.trim() || undefined,
      imagen: formulario.imagen.trim(),
      imagenes,
    }

    setGuardando(true)
    try {
      if (editandoId) {
        await catalogoService.actualizarProducto(editandoId, datos)
        mostrar('Producto actualizado', 'success')
      } else {
        await catalogoService.crearProducto(datos)
        mostrar('Producto agregado al catálogo', 'success')
      }
      setModalAbierto(false)
      await cargar()
    } catch (err: unknown) {
      setErrorFormulario(err)
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async () => {
    if (!productoEstado) return
    setCambiandoEstado(true)
    try {
      const actualizado = await catalogoService.cambiarEstadoProducto(
        productoEstado.id,
        !productoEstado.activo,
      )
      mostrar(
        actualizado.activo
          ? 'Producto activado y visible en el catálogo'
          : 'Producto desactivado del catálogo',
        'success',
      )
      setProductoEstado(null)
      await cargar()
    } catch (err: unknown) {
      mostrar(mensajeDeError(err), 'danger')
    } finally {
      setCambiandoEstado(false)
    }
  }

  return (
    <>
      <section className="pt-10 pb-6">
        <div className="container-page text-center">
          <h1 className="section-title">Inventario</h1>
          <p className="page-intro mb-0">
            Agrega productos al catálogo y actualiza precios y stock de la tienda.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page">
          <Card className="gap-4 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Package className="size-5 text-brand" aria-hidden="true" />
                Productos registrados
              </h2>
              <Button type="button" variant="accent" onClick={abrirNuevo}>
                <Plus className="size-4" aria-hidden="true" />
                Agregar producto
              </Button>
            </div>

            <form
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault()
                setQ(qInput)
                setPagina(0)
              }}
            >
              <div>
                <Label htmlFor="buscar-producto">Buscar</Label>
                <Input
                  id="buscar-producto"
                  type="search"
                  placeholder="Nombre o descripción"
                  value={qInput}
                  onChange={(event) => setQInput(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="categoria-filtro">Categoría</Label>
                <select
                  id="categoria-filtro"
                  className={selectClase}
                  value={categoria}
                  onChange={(event) => {
                    setCategoria(event.target.value)
                    setPagina(0)
                  }}
                >
                  <option value="">Todas</option>
                  {categorias.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {item.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="estado-filtro">Estado</Label>
                <select
                  id="estado-filtro"
                  className={selectClase}
                  value={filtroActivo}
                  onChange={(event) => {
                    setFiltroActivo(event.target.value as FiltroActivo)
                    setPagina(0)
                  }}
                >
                  <option value="todos">Todos</option>
                  <option value="activos">Activos</option>
                  <option value="inactivos">Inactivos</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1">
                  <Search className="size-4" aria-hidden="true" />
                  Buscar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setQInput('')
                    setQ('')
                    setCategoria('')
                    setFiltroActivo('todos')
                    setPagina(0)
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </form>

            {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}

            {cargando ? (
              <Loading texto="Cargando inventario..." />
            ) : !productos || productos.contenido.length === 0 ? (
              <EmptyState
                titulo="No hay productos que coincidan"
                descripcion="Cambia los filtros o agrega un nuevo producto al catálogo."
                accion={
                  <Button type="button" onClick={abrirNuevo}>
                    <Plus className="size-4" aria-hidden="true" />
                    Agregar producto
                  </Button>
                }
              />
            ) : (
              <>
                <div className="table-wrap">
                  <Table className="min-w-[980px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>ID</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productos.contenido.map((producto) => (
                        <TableRow key={producto.id}>
                          <TableCell className="text-muted-foreground">{producto.id}</TableCell>
                          <TableCell className="whitespace-normal">
                            <div className="flex items-center gap-3">
                              {producto.imagen ? (
                                <img
                                  src={assetUrl(producto.imagen)}
                                  alt=""
                                  width={48}
                                  height={48}
                                  className="size-12 shrink-0 rounded-lg border border-border object-cover"
                                />
                              ) : (
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                  <ImageIcon className="size-5" aria-hidden="true" />
                                </span>
                              )}
                              <div className="min-w-0">
                                <span className="block font-bold">{producto.nombre}</span>
                                <span className="block max-w-[260px] truncate text-xs text-muted-foreground">
                                  {producto.descripcion}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{producto.categoria.nombre}</TableCell>
                          <TableCell>{formatCLP(producto.precio)}</TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                'font-bold',
                                producto.stockBajo ? 'text-destructive' : 'text-emerald-700',
                              )}
                            >
                              {formatNumber(producto.stock)}
                            </span>
                            {producto.stockBajo && (
                              <Badge variant="warning" className="mt-1 block w-fit">
                                Stock bajo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={producto.activo ? 'success' : 'muted'}>
                              {producto.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => void abrirEditar(producto)}
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={producto.activo ? 'destructive' : 'default'}
                                onClick={() => setProductoEstado(producto)}
                              >
                                {producto.activo ? 'Desactivar' : 'Activar'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(productos.totalElementos)} producto
                    {productos.totalElementos === 1 ? '' : 's'} en total
                  </span>
                  <Pagination
                    pagina={productos.pagina}
                    totalPaginas={productos.totalPaginas}
                    onChange={setPagina}
                  />
                </div>
              </>
            )}
          </Card>
        </div>
      </section>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editandoId ? 'Editar producto' : 'Agregar producto'}
            </DialogTitle>
            <DialogDescription>
              Completa los datos del producto. Los campos con * son obligatorios.
            </DialogDescription>
          </DialogHeader>

          {cargandoEdicion ? (
            <Loading texto="Cargando producto..." />
          ) : (
            <form className="space-y-4" onSubmit={guardar}>
              {Boolean(errorFormulario) && (
                <ErrorAlert error={errorFormulario} onClose={() => setErrorFormulario(null)} />
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="nombre-producto">Nombre *</Label>
                  <Input
                    id="nombre-producto"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={actualizar}
                    maxLength={150}
                    aria-invalid={Boolean(erroresFormulario.nombre)}
                    required
                  />
                  {erroresFormulario.nombre && (
                    <p className="field-error">{erroresFormulario.nombre}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="categoria-producto">Categoría *</Label>
                  <select
                    id="categoria-producto"
                    name="categoriaSlug"
                    className={cn(
                      selectClase,
                      erroresFormulario.categoriaSlug && 'border-destructive',
                    )}
                    value={formulario.categoriaSlug}
                    onChange={actualizar}
                    aria-invalid={Boolean(erroresFormulario.categoriaSlug)}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {categorias.map((item) => (
                      <option key={item.id} value={item.slug}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                  {erroresFormulario.categoriaSlug && (
                    <p className="field-error">{erroresFormulario.categoriaSlug}</p>
                  )}
                </div>
                <div className="sm:col-span-3">
                  <Label htmlFor="descripcion-producto">Descripción *</Label>
                  <Textarea
                    id="descripcion-producto"
                    name="descripcion"
                    rows={3}
                    value={formulario.descripcion}
                    onChange={actualizar}
                    maxLength={1000}
                    aria-invalid={Boolean(erroresFormulario.descripcion)}
                    required
                  />
                  {erroresFormulario.descripcion && (
                    <p className="field-error">{erroresFormulario.descripcion}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="precio-producto">Precio CLP *</Label>
                  <Input
                    id="precio-producto"
                    name="precio"
                    type="number"
                    min={1}
                    step={1}
                    value={formulario.precio}
                    onChange={actualizar}
                    aria-invalid={Boolean(erroresFormulario.precio)}
                    required
                  />
                  {erroresFormulario.precio && (
                    <p className="field-error">{erroresFormulario.precio}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="stock-producto">Stock *</Label>
                  <Input
                    id="stock-producto"
                    name="stock"
                    type="number"
                    min={0}
                    step={1}
                    value={formulario.stock}
                    onChange={actualizar}
                    aria-invalid={Boolean(erroresFormulario.stock)}
                    required
                  />
                  {erroresFormulario.stock && (
                    <p className="field-error">{erroresFormulario.stock}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="material-producto">Material</Label>
                  <Input
                    id="material-producto"
                    name="material"
                    value={formulario.material}
                    onChange={actualizar}
                    maxLength={120}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="dimensiones-producto">Dimensiones</Label>
                  <Input
                    id="dimensiones-producto"
                    name="dimensiones"
                    value={formulario.dimensiones}
                    onChange={actualizar}
                    maxLength={120}
                  />
                </div>
                <div>
                  <Label htmlFor="imagen-producto">Imagen principal *</Label>
                  <Input
                    id="imagen-producto"
                    name="imagen"
                    value={formulario.imagen}
                    onChange={actualizar}
                    placeholder="/assets/imagenes/macetero-1.webp"
                    maxLength={500}
                    aria-invalid={Boolean(erroresFormulario.imagen)}
                    required
                  />
                  {erroresFormulario.imagen && (
                    <p className="field-error">{erroresFormulario.imagen}</p>
                  )}
                </div>
                <div className="sm:col-span-3">
                  <Label htmlFor="imagenes-producto">
                    Galería (una ruta por línea, máximo 8)
                  </Label>
                  <Textarea
                    id="imagenes-producto"
                    name="imagenes"
                    rows={3}
                    value={formulario.imagenes}
                    onChange={actualizar}
                    placeholder={'/assets/imagenes/macetero-1.webp\n/assets/imagenes/macetero-2.webp'}
                  />
                </div>
                {formulario.imagen && (
                  <div className="sm:col-span-3">
                    <span className="mb-2 block text-xs text-muted-foreground">Vista previa</span>
                    <img
                      src={assetUrl(formulario.imagen)}
                      alt="Vista previa del producto"
                      className="size-28 rounded-xl border border-border object-cover"
                    />
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalAbierto(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={guardando}>
                  {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar producto'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmModal
        abierto={Boolean(productoEstado)}
        titulo={productoEstado?.activo ? 'Desactivar producto' : 'Activar producto'}
        textoConfirmar={productoEstado?.activo ? 'Desactivar' : 'Activar'}
        variante={productoEstado?.activo ? 'danger' : 'success'}
        ocupado={cambiandoEstado}
        onConfirmar={cambiarEstado}
        onCancelar={() => setProductoEstado(null)}
      >
        <p className="mb-0">
          {productoEstado?.activo
            ? 'El producto dejará de mostrarse en el catálogo público, pero se conservará en el inventario.'
            : 'El producto volverá a mostrarse en el catálogo público.'}
        </p>
      </ConfirmModal>
    </>
  )
}
