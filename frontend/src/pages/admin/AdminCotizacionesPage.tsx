import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorAlert, mensajeDeError } from '../../components/common/ErrorAlert'
import { Loading } from '../../components/common/Loading'
import { Pagination } from '../../components/common/Pagination'
import { CotizacionBadge } from '../../components/common/StatusBadge'
import { useNotification } from '../../context/NotificationContext'
import { cotizacionService } from '../../services/cotizaciones'
import type {
  CotizacionDetalle,
  CotizacionResumen,
  PaginaResponse,
} from '../../types/api'
import { formatCLP, formatDateTime } from '../../utils/format'

interface FormularioPresupuesto {
  montoTotal: string
  plazoEntregaDias: string
  observaciones: string
}

export function AdminCotizacionesPage() {
  const { mostrar } = useNotification()
  const [cotizaciones, setCotizaciones] = useState<PaginaResponse<CotizacionResumen> | null>(null)
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const [detalle, setDetalle] = useState<CotizacionDetalle | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState<unknown>(null)
  const [presupuesto, setPresupuesto] = useState<FormularioPresupuesto>({
    montoTotal: '',
    plazoEntregaDias: '',
    observaciones: '',
  })
  const [errorPresupuesto, setErrorPresupuesto] = useState<unknown>(null)
  const [guardandoPresupuesto, setGuardandoPresupuesto] = useState(false)
  const [descargandoArchivo, setDescargandoArchivo] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const respuesta = await cotizacionService.listarAdmin({
        q: q || undefined,
        estado: estado || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        pagina,
        tamano: 15,
      })
      setCotizaciones(respuesta)
    } catch (err: unknown) {
      setError(err)
    } finally {
      setCargando(false)
    }
  }, [q, estado, desde, hasta, pagina])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const verDetalle = async (cotizacion: CotizacionResumen) => {
    setModalAbierto(true)
    setCargandoDetalle(true)
    setErrorDetalle(null)
    setDetalle(null)
    setErrorPresupuesto(null)
    try {
      const respuesta = await cotizacionService.obtener(cotizacion.id)
      setDetalle(respuesta)
      setPresupuesto({
        montoTotal: respuesta.montoTotal ? String(respuesta.montoTotal) : '',
        plazoEntregaDias: respuesta.plazoEntregaDias ? String(respuesta.plazoEntregaDias) : '',
        observaciones: respuesta.observacionesPresupuesto ?? '',
      })
    } catch (err: unknown) {
      setErrorDetalle(err)
    } finally {
      setCargandoDetalle(false)
    }
  }

  const guardarPresupuesto = async (event: FormEvent) => {
    event.preventDefault()
    if (!detalle) return
    setErrorPresupuesto(null)
    if (presupuesto.montoTotal === '' || Number(presupuesto.montoTotal) < 0) {
      setErrorPresupuesto(new Error('Ingresa un monto total válido'))
      return
    }
    if (
      presupuesto.plazoEntregaDias === '' ||
      Number(presupuesto.plazoEntregaDias) < 1 ||
      Number(presupuesto.plazoEntregaDias) > 365
    ) {
      setErrorPresupuesto(new Error('El plazo debe estar entre 1 y 365 días'))
      return
    }
    setGuardandoPresupuesto(true)
    try {
      const actualizado = await cotizacionService.presupuestar(detalle.id, {
        montoTotal: Number(presupuesto.montoTotal),
        plazoEntregaDias: Number(presupuesto.plazoEntregaDias),
        observaciones: presupuesto.observaciones.trim() || undefined,
      })
      setDetalle(actualizado)
      mostrar('Presupuesto guardado y correo registrado en el log', 'success')
      await cargar()
    } catch (err: unknown) {
      setErrorPresupuesto(err)
    } finally {
      setGuardandoPresupuesto(false)
    }
  }

  const descargarArchivo = async (archivoId: number, nombre: string) => {
    setDescargandoArchivo(archivoId)
    try {
      await cotizacionService.descargarArchivo(archivoId, nombre)
      mostrar('Archivo descargado', 'success')
    } catch (err: unknown) {
      mostrar(mensajeDeError(err), 'danger')
    } finally {
      setDescargandoArchivo(null)
    }
  }

  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="titulo-seccion">Cotizaciones</h1>
          <p className="pagina-intro">
            Revisa solicitudes, descarga archivos 3D y asigna monto y plazo de entrega.
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
                <label htmlFor="buscar-cotizacion" className="form-label">
                  Buscar
                </label>
                <input
                  id="buscar-cotizacion"
                  type="search"
                  className="form-control"
                  placeholder="Ticket, cliente o correo"
                  value={qInput}
                  onChange={(event) => setQInput(event.target.value)}
                />
              </div>
              <div className="col-md-2">
                <label htmlFor="estado-cotizacion" className="form-label">
                  Estado
                </label>
                <select
                  id="estado-cotizacion"
                  className="form-select"
                  value={estado}
                  onChange={(event) => {
                    setEstado(event.target.value)
                    setPagina(0)
                  }}
                >
                  <option value="">Todos</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Presupuestada">Presupuestada</option>
                </select>
              </div>
              <div className="col-md-2">
                <label htmlFor="cotizacion-desde" className="form-label">
                  Desde
                </label>
                <input
                  id="cotizacion-desde"
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
                <label htmlFor="cotizacion-hasta" className="form-label">
                  Hasta
                </label>
                <input
                  id="cotizacion-hasta"
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
              <Loading texto="Cargando cotizaciones..." />
            ) : !cotizaciones || cotizaciones.contenido.length === 0 ? (
              <EmptyState
                titulo="No hay cotizaciones que coincidan"
                descripcion="Las solicitudes enviadas desde el formulario público aparecerán aquí."
              />
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-hover align-middle tabla-marca tabla-admin mb-0">
                    <thead>
                      <tr>
                        <th scope="col">Ticket</th>
                        <th scope="col">Fecha</th>
                        <th scope="col">Cliente</th>
                        <th scope="col">Categoría</th>
                        <th scope="col">Cantidad</th>
                        <th scope="col">Archivos</th>
                        <th scope="col">Estado</th>
                        <th scope="col">Presupuesto</th>
                        <th scope="col">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cotizaciones.contenido.map((cotizacion) => (
                        <tr key={cotizacion.id}>
                          <td className="fw-bold font-monospace">{cotizacion.numeroTicket}</td>
                          <td>{formatDateTime(cotizacion.fechaCreacion)}</td>
                          <td>
                            <span className="d-block">
                              {cotizacion.nombre} {cotizacion.apellido}
                            </span>
                            <span className="small texto-gris d-block">{cotizacion.correo}</span>
                          </td>
                          <td className="small">{cotizacion.categoria}</td>
                          <td>{cotizacion.cantidad ?? '—'}</td>
                          <td>{cotizacion.cantidadArchivos}</td>
                          <td>
                            <CotizacionBadge estado={cotizacion.estado} />
                          </td>
                          <td>{cotizacion.montoTotal ? formatCLP(cotizacion.montoTotal) : '—'}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-marca-outline rounded-pill"
                              onClick={() => void verDetalle(cotizacion)}
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
                    {cotizaciones.totalElementos} cotización
                    {cotizaciones.totalElementos === 1 ? '' : 'es'} en total
                  </span>
                  <Pagination
                    pagina={cotizaciones.pagina}
                    totalPaginas={cotizaciones.totalPaginas}
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
                    {detalle ? `Cotización ${detalle.numeroTicket}` : 'Detalle de cotización'}
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
                    <Loading texto="Cargando cotización..." />
                  ) : errorDetalle ? (
                    <ErrorAlert error={errorDetalle} onClose={() => setErrorDetalle(null)} />
                  ) : detalle ? (
                    <>
                      <div className="row g-3 mb-4">
                        <div className="col-md-5">
                          <h3 className="h6 fw-bold">Solicitante</h3>
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
                          </p>
                        </div>
                        <div className="col-md-3">
                          <h3 className="h6 fw-bold">Proyecto</h3>
                          <p className="small mb-0">
                            Categoría: {detalle.categoria}
                            <br />
                            Cantidad: {detalle.cantidad ?? 'No indicada'}
                            <br />
                            Plazo: {detalle.plazo || 'Sin preferencia'}
                          </p>
                        </div>
                        <div className="col-md-4">
                          <h3 className="h6 fw-bold">Estado</h3>
                          <p className="small mb-0">
                            <CotizacionBadge estado={detalle.estado} />
                            <br />
                            Creada: {formatDateTime(detalle.fechaCreacion)}
                            {detalle.fechaPresupuesto && (
                              <>
                                <br />
                                Presupuestada: {formatDateTime(detalle.fechaPresupuesto)}
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <h3 className="h6 fw-bold">Descripción</h3>
                      <p className="small" style={{ whiteSpace: 'pre-wrap' }}>
                        {detalle.descripcion}
                      </p>

                      <h3 className="h6 fw-bold">Archivos 3D</h3>
                      {detalle.archivos.length === 0 ? (
                        <p className="small texto-gris">No se adjuntaron archivos.</p>
                      ) : (
                        <ul className="list-group mb-3">
                          {detalle.archivos.map((archivo) => (
                            <li
                              key={archivo.id}
                              className="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2"
                            >
                              <span>
                                <i className="bi bi-file-earmark me-2 texto-marca" aria-hidden="true" />
                                {archivo.nombreOriginal}{' '}
                                <span className="small texto-gris">
                                  ({archivo.tamanoLegible} · {archivo.extension})
                                </span>
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-marca-outline rounded-pill"
                                onClick={() => void descargarArchivo(archivo.id, archivo.nombreOriginal)}
                                disabled={descargandoArchivo === archivo.id}
                              >
                                {descargandoArchivo === archivo.id ? 'Descargando...' : 'Descargar'}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      <hr />
                      <h3 className="h6 fw-bold">Presupuesto</h3>
                      {detalle.estado === 'Presupuestada' ? (
                        <div className="row g-3">
                          <div className="col-md-3">
                            <span className="small texto-gris d-block">Monto total</span>
                            <strong>{formatCLP(detalle.montoTotal ?? 0)}</strong>
                          </div>
                          <div className="col-md-3">
                            <span className="small texto-gris d-block">Plazo de entrega</span>
                            <strong>{detalle.plazoEntregaDias ?? '—'} días</strong>
                          </div>
                          <div className="col-md-6">
                            <span className="small texto-gris d-block">Observaciones</span>
                            <span>{detalle.observacionesPresupuesto || 'Sin observaciones'}</span>
                          </div>
                          {detalle.enlacePago && (
                            <div className="col-12">
                              <a
                                href={detalle.enlacePago}
                                className="btn btn-marca rounded-pill"
                                target="_blank"
                                rel="noreferrer"
                              >
                                <i className="bi bi-link-45deg me-1" aria-hidden="true" />
                                Abrir enlace de pago
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <form className="row g-3" onSubmit={guardarPresupuesto}>
                          {Boolean(errorPresupuesto) && (
                            <div className="col-12">
                              <ErrorAlert
                                error={errorPresupuesto}
                                onClose={() => setErrorPresupuesto(null)}
                              />
                            </div>
                          )}
                          <div className="col-md-4">
                            <label htmlFor="monto-total" className="form-label">
                              Monto total (CLP) *
                            </label>
                            <input
                              id="monto-total"
                              type="number"
                              min={0}
                              step={1}
                              className="form-control"
                              value={presupuesto.montoTotal}
                              onChange={(event) =>
                                setPresupuesto((actual) => ({
                                  ...actual,
                                  montoTotal: event.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                          <div className="col-md-4">
                            <label htmlFor="plazo-entrega" className="form-label">
                              Plazo de entrega (días) *
                            </label>
                            <input
                              id="plazo-entrega"
                              type="number"
                              min={1}
                              max={365}
                              className="form-control"
                              value={presupuesto.plazoEntregaDias}
                              onChange={(event) =>
                                setPresupuesto((actual) => ({
                                  ...actual,
                                  plazoEntregaDias: event.target.value,
                                }))
                              }
                              required
                            />
                          </div>
                          <div className="col-12">
                            <label htmlFor="observaciones-presupuesto" className="form-label">
                              Observaciones
                            </label>
                            <textarea
                              id="observaciones-presupuesto"
                              rows={3}
                              className="form-control"
                              value={presupuesto.observaciones}
                              onChange={(event) =>
                                setPresupuesto((actual) => ({
                                  ...actual,
                                  observaciones: event.target.value,
                                }))
                              }
                              maxLength={1000}
                            />
                          </div>
                          <div className="col-12">
                            <button
                              type="submit"
                              className="btn btn-acento rounded-pill px-4"
                              disabled={guardandoPresupuesto}
                            >
                              {guardandoPresupuesto ? 'Guardando...' : 'Guardar presupuesto'}
                            </button>
                          </div>
                        </form>
                      )}
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
