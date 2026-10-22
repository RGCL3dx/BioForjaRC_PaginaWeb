import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorAlert, mensajeDeError } from '../../components/common/ErrorAlert'
import { Loading } from '../../components/common/Loading'
import { Pagination } from '../../components/common/Pagination'
import { useNotification } from '../../context/NotificationContext'
import { catalogoService } from '../../services/catalogo'
import type {
  Categoria,
  PaginaResponse,
  ProductoRequest,
  ProductoResumen,
} from '../../types/api'
import { assetUrl, formatCLP, formatNumber } from '../../utils/format'

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

  const campoClase = (campo: string) =>
    `form-control${erroresFormulario[campo] ? ' is-invalid' : ''}`

  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="titulo-seccion">Inventario</h1>
          <p className="pagina-intro">
            Agrega productos al catálogo y actualiza precios y stock de la tienda.
          </p>
        </div>
      </section>

      <section className="py-4">
        <div className="container">
          <div className="card card-formulario p-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
              <h2 className="h5 fw-bold mb-0">
                <i className="bi bi-cube me-2 pie-icono text-marca" aria-hidden="true" />
                Productos registrados
              </h2>
              <button type="button" className="btn btn-acento rounded-pill px-4" onClick={abrirNuevo}>
                <i className="bi bi-plus-circle me-1" aria-hidden="true" />
                Agregar producto
              </button>
            </div>

            <form
              className="row g-2 mb-3 align-items-end"
              onSubmit={(event) => {
                event.preventDefault()
                setQ(qInput)
                setPagina(0)
              }}
            >
              <div className="col-md-4">
                <label htmlFor="buscar-producto" className="form-label">
                  Buscar
                </label>
                <input
                  id="buscar-producto"
                  type="search"
                  className="form-control"
                  placeholder="Nombre o descripción"
                  value={qInput}
                  onChange={(event) => setQInput(event.target.value)}
                />
              </div>
              <div className="col-md-3">
                <label htmlFor="categoria-filtro" className="form-label">
                  Categoría
                </label>
                <select
                  id="categoria-filtro"
                  className="form-select"
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
              <div className="col-md-3">
                <label htmlFor="estado-filtro" className="form-label">
                  Estado
                </label>
                <select
                  id="estado-filtro"
                  className="form-select"
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
              <div className="col-md-2 d-flex gap-2">
                <button type="submit" className="btn btn-marca rounded-pill flex-grow-1">
                  Buscar
                </button>
                <button
                  type="button"
                  className="btn btn-marca-outline rounded-pill"
                  onClick={() => {
                    setQInput('')
                    setQ('')
                    setCategoria('')
                    setFiltroActivo('todos')
                    setPagina(0)
                  }}
                >
                  Limpiar
                </button>
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
                  <button type="button" className="btn btn-marca rounded-pill" onClick={abrirNuevo}>
                    Agregar producto
                  </button>
                }
              />
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle tabla-marca tabla-admin mb-0">
                    <thead>
                      <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Producto</th>
                        <th scope="col">Categoría</th>
                        <th scope="col">Precio</th>
                        <th scope="col">Stock</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.contenido.map((producto) => (
                        <tr key={producto.id}>
                          <td>{producto.id}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <img
                                src={assetUrl(producto.imagen)}
                                alt=""
                                width={48}
                                height={48}
                                className="rounded-2"
                                style={{ objectFit: 'cover' }}
                              />
                              <div>
                                <span className="fw-bold d-block">{producto.nombre}</span>
                                <span className="small texto-gris d-block text-truncate" style={{ maxWidth: '260px' }}>
                                  {producto.descripcion}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>{producto.categoria.nombre}</td>
                          <td>{formatCLP(producto.precio)}</td>
                          <td>
                            <span className={`fw-bold ${producto.stockBajo ? 'text-danger' : 'text-success'}`}>
                              {formatNumber(producto.stock)}
                            </span>
                            {producto.stockBajo && (
                              <span className="badge text-bg-warning d-block mt-1">Stock bajo</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge rounded-pill ${
                                producto.activo ? 'text-bg-success' : 'text-bg-secondary'
                              }`}
                            >
                              {producto.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-marca-outline rounded-pill"
                                onClick={() => void abrirEditar(producto)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className={`btn btn-sm rounded-pill ${
                                  producto.activo ? 'btn-outline-danger' : 'btn-marca'
                                }`}
                                onClick={() => setProductoEstado(producto)}
                              >
                                {producto.activo ? 'Desactivar' : 'Activar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                  <span className="small texto-gris">
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
          </div>
        </div>
      </section>

      {modalAbierto && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <form className="modal-content" onSubmit={guardar}>
                <div className="modal-header">
                  <h2 className="modal-title h5">
                    {editandoId ? 'Editar producto' : 'Agregar producto'}
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Cerrar"
                    onClick={() => setModalAbierto(false)}
                  />
                </div>
                <div className="modal-body">
                  {cargandoEdicion ? (
                    <Loading texto="Cargando producto..." />
                  ) : (
                    <>
                      {Boolean(errorFormulario) && (
                        <ErrorAlert
                          error={errorFormulario}
                          onClose={() => setErrorFormulario(null)}
                        />
                      )}
                      <div className="row g-3">
                        <div className="col-md-8">
                          <label htmlFor="nombre-producto" className="form-label">
                            Nombre *
                          </label>
                          <input
                            id="nombre-producto"
                            name="nombre"
                            className={campoClase('nombre')}
                            value={formulario.nombre}
                            onChange={actualizar}
                            maxLength={150}
                            required
                          />
                          {erroresFormulario.nombre && (
                            <div className="invalid-feedback">{erroresFormulario.nombre}</div>
                          )}
                        </div>
                        <div className="col-md-4">
                          <label htmlFor="categoria-producto" className="form-label">
                            Categoría *
                          </label>
                          <select
                            id="categoria-producto"
                            name="categoriaSlug"
                            className={`form-select${erroresFormulario.categoriaSlug ? ' is-invalid' : ''}`}
                            value={formulario.categoriaSlug}
                            onChange={actualizar}
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
                            <div className="invalid-feedback">{erroresFormulario.categoriaSlug}</div>
                          )}
                        </div>
                        <div className="col-12">
                          <label htmlFor="descripcion-producto" className="form-label">
                            Descripción *
                          </label>
                          <textarea
                            id="descripcion-producto"
                            name="descripcion"
                            rows={3}
                            className={`form-control${erroresFormulario.descripcion ? ' is-invalid' : ''}`}
                            value={formulario.descripcion}
                            onChange={actualizar}
                            maxLength={1000}
                            required
                          />
                          {erroresFormulario.descripcion && (
                            <div className="invalid-feedback">{erroresFormulario.descripcion}</div>
                          )}
                        </div>
                        <div className="col-md-4">
                          <label htmlFor="precio-producto" className="form-label">
                            Precio CLP *
                          </label>
                          <input
                            id="precio-producto"
                            name="precio"
                            type="number"
                            min={1}
                            step={1}
                            className={campoClase('precio')}
                            value={formulario.precio}
                            onChange={actualizar}
                            required
                          />
                          {erroresFormulario.precio && (
                            <div className="invalid-feedback">{erroresFormulario.precio}</div>
                          )}
                        </div>
                        <div className="col-md-4">
                          <label htmlFor="stock-producto" className="form-label">
                            Stock *
                          </label>
                          <input
                            id="stock-producto"
                            name="stock"
                            type="number"
                            min={0}
                            step={1}
                            className={campoClase('stock')}
                            value={formulario.stock}
                            onChange={actualizar}
                            required
                          />
                          {erroresFormulario.stock && (
                            <div className="invalid-feedback">{erroresFormulario.stock}</div>
                          )}
                        </div>
                        <div className="col-md-4">
                          <label htmlFor="material-producto" className="form-label">
                            Material
                          </label>
                          <input
                            id="material-producto"
                            name="material"
                            className="form-control"
                            value={formulario.material}
                            onChange={actualizar}
                            maxLength={120}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="dimensiones-producto" className="form-label">
                            Dimensiones
                          </label>
                          <input
                            id="dimensiones-producto"
                            name="dimensiones"
                            className="form-control"
                            value={formulario.dimensiones}
                            onChange={actualizar}
                            maxLength={120}
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="imagen-producto" className="form-label">
                            Imagen principal *
                          </label>
                          <input
                            id="imagen-producto"
                            name="imagen"
                            className={campoClase('imagen')}
                            value={formulario.imagen}
                            onChange={actualizar}
                            placeholder="/assets/imagenes/macetero-1.webp"
                            maxLength={500}
                            required
                          />
                          {erroresFormulario.imagen && (
                            <div className="invalid-feedback">{erroresFormulario.imagen}</div>
                          )}
                        </div>
                        <div className="col-12">
                          <label htmlFor="imagenes-producto" className="form-label">
                            Galería (una ruta por línea, máximo 8)
                          </label>
                          <textarea
                            id="imagenes-producto"
                            name="imagenes"
                            rows={3}
                            className="form-control"
                            value={formulario.imagenes}
                            onChange={actualizar}
                            placeholder={`/assets/imagenes/macetero-1.webp\n/assets/imagenes/macetero-2.webp`}
                          />
                        </div>
                        {formulario.imagen && (
                          <div className="col-12">
                            <span className="small texto-gris d-block mb-2">Vista previa</span>
                            <img
                              src={assetUrl(formulario.imagen)}
                              alt="Vista previa del producto"
                              className="rounded-3"
                              style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill"
                    onClick={() => setModalAbierto(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-marca rounded-pill"
                    disabled={guardando || cargandoEdicion}
                  >
                    {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Agregar producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

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
