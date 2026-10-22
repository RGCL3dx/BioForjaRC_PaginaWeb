import { useCallback, useEffect, useState } from 'react'
import { ErrorAlert, mensajeDeError } from '../../components/common/ErrorAlert'
import { EmptyState } from '../../components/common/EmptyState'
import { Loading } from '../../components/common/Loading'
import { Pagination } from '../../components/common/Pagination'
import { PedidoBadge } from '../../components/common/StatusBadge'
import { useNotification } from '../../context/NotificationContext'
import { pedidoService } from '../../services/pedidos'
import type {
  EstadoPedido,
  PaginaResponse,
  PedidoDetalle,
  PedidoResumen,
} from '../../types/api'
import { formatCLP, formatDateTime } from '../../utils/format'

const estados: EstadoPedido[] = ['En preparación', 'Despachado', 'Entregado', 'Cancelado']

export function AdminPedidosPage() {
  const { mostrar } = useNotification()
  const [pedidos, setPedidos] = useState<PaginaResponse<PedidoResumen> | null>(null)
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const [detalle, setDetalle] = useState<PedidoDetalle | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState<unknown>(null)
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPedido>('En preparación')
  const [guardandoEstado, setGuardandoEstado] = useState(false)
  const [descargando, setDescargando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const respuesta = await pedidoService.listarAdmin({
        q: q || undefined,
        estado: estado || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        pagina,
        tamano: 15,
      })
      setPedidos(respuesta)
    } catch (err: unknown) {
      setError(err)
    } finally {
      setCargando(false)
    }
  }, [q, estado, desde, hasta, pagina])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const verDetalle = async (pedido: PedidoResumen) => {
    setModalAbierto(true)
    setCargandoDetalle(true)
    setErrorDetalle(null)
    setDetalle(null)
    try {
      const respuesta = await pedidoService.obtener(pedido.id)
      setDetalle(respuesta)
      setNuevoEstado(respuesta.estado)
    } catch (err: unknown) {
      setErrorDetalle(err)
    } finally {
      setCargandoDetalle(false)
    }
  }

  const guardarEstado = async () => {
    if (!detalle) return
    setGuardandoEstado(true)
    setErrorDetalle(null)
    try {
      const actualizado = await pedidoService.cambiarEstado(detalle.id, nuevoEstado)
      setDetalle(actualizado)
      mostrar(`Pedido ${detalle.numeroOrden} actualizado a "${nuevoEstado}"`, 'success')
      await cargar()
    } catch (err: unknown) {
      setErrorDetalle(err)
    } finally {
      setGuardandoEstado(false)
    }
  }

  const descargarComprobante = async () => {
    if (!detalle) return
    setDescargando(true)
    try {
      await pedidoService.descargarComprobante(detalle.id, detalle.numeroOrden)
      mostrar('Comprobante descargado', 'success')
    } catch (err: unknown) {
      mostrar(mensajeDeError(err), 'danger')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="titulo-seccion">Pedidos</h1>
          <p className="pagina-intro">
            Revisa las compras, descarga comprobantes y actualiza el estado de despacho.
          </p>
        </div>
      </section>

      <section className="py-4">
        <div className="container">
          <div className="card card-formulario p-4">
            <form
              className="row g-2 mb-3 align-items-end"
              onSubmit={(event) => {
                event.preventDefault()
                setQ(qInput)
                setPagina(0)
              }}
            >
              <div className="col-md-4">
                <label htmlFor="buscar-pedido" className="form-label">
                  Buscar
                </label>
                <input
                  id="buscar-pedido"
                  type="search"
                  className="form-control"
                  placeholder="Orden, cliente o correo"
                  value={qInput}
                  onChange={(event) => setQInput(event.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="estado-pedido" className="form-label">
                  Estado
                </label>
                <select
                  id="estado-pedido"
                  className="form-select"
                  value={estado}
                  onChange={(event) => {
                    setEstado(event.target.value)
                    setPagina(0)
                  }}
                >
                  <option value="">Todos</option>
                  {estados.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label htmlFor="pedido-desde" className="form-label">
                  Desde
                </label>
                <input
                  id="pedido-desde"
                  type="date"
                  className="form-control"
                  value={desde}
                  onChange={(event) => {
                    setDesde(event.target.value)
                    setPagina(0)
                  }}
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="pedido-hasta" className="form-label">
                  Hasta
                </label>
                <input
                  id="pedido-hasta"
                  type="date"
                  className="form-control"
                  value={hasta}
                  onChange={(event) => {
                    setHasta(event.target.value)
                    setPagina(0)
                  }}
                />
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
                    setEstado('')
                    setDesde('')
                    setHasta('')
                    setPagina(0)
                  }}
                >
                  Limpiar
                </button>
              </div>
            </form>

            {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}

            {cargando ? (
              <Loading texto="Cargando pedidos..." />
            ) : !pedidos || pedidos.contenido.length === 0 ? (
              <EmptyState
                titulo="No hay pedidos que coincidan"
                descripcion="Los pedidos de los clientes aparecerán aquí cuando se realicen compras."
              />
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle tabla-marca tabla-admin mb-0">
                    <thead>
                      <tr>
                        <th scope="col">Orden</th>
                        <th scope="col">Fecha</th>
                        <th scope="col">Cliente</th>
                        <th scope="col">Total</th>
                        <th scope="col">Pago</th>
                        <th scope="col">Despacho</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidos.contenido.map((pedido) => (
                        <tr key={pedido.id}>
                          <td className="fw-bold">{pedido.numeroOrden}</td>
                          <td>{formatDateTime(pedido.fechaCreacion)}</td>
                          <td>
                            <span className="d-block">{pedido.cliente}</span>
                            <span className="small texto-gris d-block">{pedido.correo}</span>
                          </td>
                          <td>{formatCLP(pedido.total)}</td>
                          <td>
                            <span className="small d-block">{pedido.metodoPago}</span>
                            <span className="badge rounded-pill text-bg-light border">
                              {pedido.estadoPago}
                            </span>
                          </td>
                          <td className="small">{pedido.metodoDespacho}</td>
                          <td>
                            <PedidoBadge estado={pedido.estado} />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-marca-outline rounded-pill"
                              onClick={() => void verDetalle(pedido)}
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3">
                  <span className="small texto-gris">
                    {pedidos.totalElementos} pedido{pedidos.totalElementos === 1 ? '' : 's'} en total
                  </span>
                  <Pagination
                    pagina={pedidos.pagina}
                    totalPaginas={pedidos.totalPaginas}
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
            <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title h5">
                    {detalle ? `Pedido ${detalle.numeroOrden}` : 'Detalle del pedido'}
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Cerrar"
                    onClick={() => setModalAbierto(false)}
                  />
                </div>
                <div className="modal-body">
                  {cargandoDetalle ? (
                    <Loading texto="Cargando pedido..." />
                  ) : errorDetalle ? (
                    <ErrorAlert error={errorDetalle} onClose={() => setErrorDetalle(null)} />
                  ) : detalle ? (
                    <>
                      <div className="row g-3 mb-4">
                        <div className="col-md-4">
                          <h3 className="h6 fw-bold">Cliente</h3>
                          <p className="small mb-0">
                            {detalle.nombre} {detalle.apellido}
                            <br />
                            {detalle.correo}
                            {detalle.telefono && (
                              <>
                                <br />
                                {detalle.telefono}
                              </>
                            )}
                            {detalle.rut && (
                              <>
                                <br />
                                RUT: {detalle.rut}
                              </>
                            )}
                          </p>
                        </div>
                        <div className="col-md-4">
                          <h3 className="h6 fw-bold">Despacho</h3>
                          <p className="small mb-0">
                            {detalle.metodoDespachoNombre}
                            <br />
                            {detalle.requiereDireccion ? (
                              <>
                                {detalle.direccion}
                                <br />
                                {detalle.comuna}
                                {detalle.regionNombre ? `, ${detalle.regionNombre}` : ''}
                              </>
                            ) : (
                              'Retiro presencial'
                            )}
                          </p>
                        </div>
                        <div className="col-md-4">
                          <h3 className="h6 fw-bold">Pago y documento</h3>
                          <p className="small mb-0">
                            {detalle.metodoPago} · {detalle.estadoPago}
                            <br />
                            {detalle.documentoTipo}
                            {detalle.documentoTipo.toLowerCase() === 'factura' && (
                              <>
                                <br />
                                {detalle.razonSocial} · {detalle.rutFacturacion}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <h3 className="h6 fw-bold">Productos</h3>
                      <div className="table-responsive mb-3">
                        <table className="table table-sm align-middle tabla-marca">
                          <thead>
                            <tr>
                              <th scope="col">Producto</th>
                              <th scope="col">Precio</th>
                              <th scope="col">Cantidad</th>
                              <th scope="col" className="text-end">
                                Subtotal
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {detalle.items.map((item) => (
                              <tr key={item.productoId}>
                                <td>{item.nombreProducto}</td>
                                <td>{formatCLP(item.precioUnitario)}</td>
                                <td>{item.cantidad}</td>
                                <td className="text-end">{formatCLP(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="row justify-content-end">
                        <div className="col-md-5">
                          <dl className="row small mb-2">
                            <dt className="col-7 fw-normal texto-gris">Subtotal</dt>
                            <dd className="col-5 text-end mb-0">{formatCLP(detalle.subtotal)}</dd>
                            <dt className="col-7 fw-normal texto-gris">Envío</dt>
                            <dd className="col-5 text-end mb-0">{formatCLP(detalle.costoEnvio)}</dd>
                            <dt className="col-7 fw-bold">Total</dt>
                            <dd className="col-5 text-end fw-bold mb-0">{formatCLP(detalle.total)}</dd>
                          </dl>
                        </div>
                      </div>

                      <hr />
                      <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                          <label htmlFor="nuevo-estado" className="form-label">
                            Estado de despacho
                          </label>
                          <select
                            id="nuevo-estado"
                            className="form-select select-estado-pedido"
                            value={nuevoEstado}
                            onChange={(event) => setNuevoEstado(event.target.value as EstadoPedido)}
                          >
                            {estados.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-8 d-flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-marca rounded-pill"
                            onClick={guardarEstado}
                            disabled={guardandoEstado || nuevoEstado === detalle.estado}
                          >
                            {guardandoEstado ? 'Guardando...' : 'Actualizar estado'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-marca-outline rounded-pill"
                            onClick={descargarComprobante}
                            disabled={descargando}
                          >
                            {descargando ? 'Descargando...' : 'Descargar comprobante'}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill"
                    onClick={() => setModalAbierto(false)}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </>
  )
}
