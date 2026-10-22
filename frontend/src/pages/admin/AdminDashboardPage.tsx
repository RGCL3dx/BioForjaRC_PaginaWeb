import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ErrorAlert, mensajeDeError } from '../../components/common/ErrorAlert'
import { Loading } from '../../components/common/Loading'
import { useNotification } from '../../context/NotificationContext'
import { catalogoService } from '../../services/catalogo'
import { cotizacionService } from '../../services/cotizaciones'
import { reporteService } from '../../services/reportes'
import { usuarioService } from '../../services/usuarios'
import type { ReporteVentas, ResumenInventario, Usuario } from '../../types/api'
import { formatCLP, formatDate, formatNumber, hoyISO } from '../../utils/format'

function fechaHaceDias(dias: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - dias)
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

export function AdminDashboardPage() {
  const { mostrar } = useNotification()
  const [desde, setDesde] = useState(() => fechaHaceDias(30))
  const [hasta, setHasta] = useState(() => hoyISO())
  const [reporte, setReporte] = useState<ReporteVentas | null>(null)
  const [inventario, setInventario] = useState<ResumenInventario | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [totalCotizaciones, setTotalCotizaciones] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [exportando, setExportando] = useState<'xlsx' | 'pdf' | null>(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [datosReporte, datosInventario, datosUsuarios, cotizaciones] = await Promise.all([
        reporteService.ventas(desde, hasta),
        catalogoService.resumenInventario(),
        usuarioService.listar(),
        cotizacionService.listarAdmin({ pagina: 0, tamano: 1 }),
      ])
      setReporte(datosReporte)
      setInventario(datosInventario)
      setUsuarios(datosUsuarios)
      setTotalCotizaciones(cotizaciones.totalElementos)
    } catch (err: unknown) {
      setError(err)
    } finally {
      setCargando(false)
    }
  }, [desde, hasta])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const exportar = async (formato: 'xlsx' | 'pdf') => {
    setExportando(formato)
    try {
      await reporteService.exportar(desde, hasta, formato)
      mostrar(`Reporte ${formato.toUpperCase()} descargado`, 'success')
    } catch (err: unknown) {
      mostrar(mensajeDeError(err), 'danger')
    } finally {
      setExportando(null)
    }
  }

  if (cargando && !reporte) {
    return (
      <section className="py-5">
        <div className="container">
          <Loading texto="Cargando panel de administración..." />
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="py-5">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <h1 className="titulo-seccion text-start mb-2">Panel de administración</h1>
              <p className="texto-gris mb-0">Resumen de actividad de tu tienda BioForjaRC.</p>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button type="button" className="btn btn-marca-outline rounded-pill" onClick={() => void cargar()}>
                <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
                Actualizar
              </button>
              <button
                type="button"
                className="btn btn-marca rounded-pill"
                onClick={() => void exportar('xlsx')}
                disabled={exportando !== null}
              >
                {exportando === 'xlsx' ? 'Exportando...' : 'Exportar Excel'}
              </button>
              <button
                type="button"
                className="btn btn-marca rounded-pill"
                onClick={() => void exportar('pdf')}
                disabled={exportando !== null}
              >
                {exportando === 'pdf' ? 'Exportando...' : 'Exportar PDF'}
              </button>
            </div>
          </div>

          {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}

          <div className="card card-formulario p-3 mb-4">
            <div className="row g-2 align-items-end">
              <div className="col-md-4">
                <label htmlFor="reporte-desde" className="form-label">
                  Desde
                </label>
                <input
                  id="reporte-desde"
                  type="date"
                  className="form-control"
                  value={desde}
                  onChange={(event) => setDesde(event.target.value)}
                />
              </div>
              <div className="col-md-4">
                <label htmlFor="reporte-hasta" className="form-label">
                  Hasta
                </label>
                <input
                  id="reporte-hasta"
                  type="date"
                  className="form-control"
                  value={hasta}
                  onChange={(event) => setHasta(event.target.value)}
                />
              </div>
              <div className="col-md-4">
                <button
                  type="button"
                  className="btn btn-marca rounded-pill w-100"
                  onClick={() => void cargar()}
                  disabled={cargando}
                >
                  {cargando ? 'Cargando...' : 'Aplicar rango'}
                </button>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <article className="col-sm-6 col-lg-4 col-xl-2">
              <div className="card tarjeta-metrica border-0 shadow-sm">
                <div className="card-body p-4">
                  <div>
                    <h2 className="texto-gris text-uppercase small fw-bold mb-1">Ventas</h2>
                    <p className="fs-4 fw-bold mb-0 text-marca">
                      {formatCLP(reporte?.totalVentas ?? 0)}
                    </p>
                  </div>
                  <i className="bi bi-graph-up-arrow" aria-hidden="true" />
                </div>
              </div>
            </article>
            <article className="col-sm-6 col-lg-4 col-xl-2">
              <div className="card tarjeta-metrica border-0 shadow-sm">
                <div className="card-body p-4">
                  <div>
                    <h2 className="texto-gris text-uppercase small fw-bold mb-1">Pedidos</h2>
                    <p className="fs-4 fw-bold mb-0 text-marca">
                      {formatNumber(reporte?.cantidadPedidos ?? 0)}
                    </p>
                  </div>
                  <i className="bi bi-box-seam" aria-hidden="true" />
                </div>
              </div>
            </article>
            <article className="col-sm-6 col-lg-4 col-xl-2">
              <div className="card tarjeta-metrica border-0 shadow-sm">
                <div className="card-body p-4">
                  <div>
                    <h2 className="texto-gris text-uppercase small fw-bold mb-1">Ticket promedio</h2>
                    <p className="fs-4 fw-bold mb-0 text-marca">
                      {formatCLP(reporte?.ticketPromedio ?? 0)}
                    </p>
                  </div>
                  <i className="bi bi-receipt" aria-hidden="true" />
                </div>
              </div>
            </article>
            <article className="col-sm-6 col-lg-4 col-xl-2">
              <div className="card tarjeta-metrica border-0 shadow-sm">
                <div className="card-body p-4">
                  <div>
                    <h2 className="texto-gris text-uppercase small fw-bold mb-1">Productos</h2>
                    <p className="fs-4 fw-bold mb-0 text-marca">
                      {formatNumber(inventario?.totalProductos ?? 0)}
                    </p>
                    {inventario && inventario.stockBajo > 0 && (
                      <span className="badge text-bg-warning">{inventario.stockBajo} con stock bajo</span>
                    )}
                  </div>
                  <i className="bi bi-cube" aria-hidden="true" />
                </div>
              </div>
            </article>
            <article className="col-sm-6 col-lg-4 col-xl-2">
              <div className="card tarjeta-metrica border-0 shadow-sm">
                <div className="card-body p-4">
                  <div>
                    <h2 className="texto-gris text-uppercase small fw-bold mb-1">Usuarios</h2>
                    <p className="fs-4 fw-bold mb-0 text-marca">{formatNumber(usuarios.length)}</p>
                  </div>
                  <i className="bi bi-people" aria-hidden="true" />
                </div>
              </div>
            </article>
            <article className="col-sm-6 col-lg-4 col-xl-2">
              <div className="card tarjeta-metrica border-0 shadow-sm">
                <div className="card-body p-4">
                  <div>
                    <h2 className="texto-gris text-uppercase small fw-bold mb-1">Cotizaciones</h2>
                    <p className="fs-4 fw-bold mb-0 text-marca">{formatNumber(totalCotizaciones)}</p>
                  </div>
                  <i className="bi bi-envelope-paper" aria-hidden="true" />
                </div>
              </div>
            </article>
          </div>

          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card card-formulario p-4 h-100">
                <h2 className="h5 fw-bold mb-3">
                  <i className="bi bi-trophy me-2 pie-icono text-marca" aria-hidden="true" />
                  Productos más vendidos
                </h2>
                {reporte && reporte.topProductos.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle tabla-marca mb-0">
                      <thead>
                        <tr>
                          <th scope="col">Producto</th>
                          <th scope="col">Unidades</th>
                          <th scope="col">Ingresos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporte.topProductos.map((producto) => (
                          <tr key={producto.productoId ?? producto.nombre}>
                            <td>{producto.nombre}</td>
                            <td>{formatNumber(producto.unidades)}</td>
                            <td className="fw-bold">{formatCLP(producto.ingresos)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="texto-gris mb-0">No hay ventas registradas en el período seleccionado.</p>
                )}
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card card-formulario p-4 mb-4">
                <h2 className="h5 fw-bold mb-3">Accesos rápidos</h2>
                <div className="d-grid gap-2">
                  <Link to="/admin/inventario" className="btn btn-marca-outline rounded-pill text-start">
                    <i className="bi bi-cube me-2" aria-hidden="true" />
                    Gestionar inventario
                  </Link>
                  <Link to="/admin/pedidos" className="btn btn-marca-outline rounded-pill text-start">
                    <i className="bi bi-box-seam me-2" aria-hidden="true" />
                    Revisar pedidos
                  </Link>
                  <Link to="/admin/usuarios" className="btn btn-marca-outline rounded-pill text-start">
                    <i className="bi bi-people me-2" aria-hidden="true" />
                    Administrar usuarios
                  </Link>
                  <Link to="/admin/cotizaciones" className="btn btn-marca-outline rounded-pill text-start">
                    <i className="bi bi-envelope-paper me-2" aria-hidden="true" />
                    Ver cotizaciones
                  </Link>
                </div>
              </div>

              <div className="card card-formulario p-4">
                <h2 className="h6 fw-bold">Rango del reporte</h2>
                <p className="small texto-gris mb-1">
                  Desde {formatDate(desde)} hasta {formatDate(hasta)}
                </p>
                <p className="small texto-gris mb-0">
                  Unidades vendidas: {formatNumber(reporte?.unidadesVendidas ?? 0)}
                </p>
                {inventario && (
                  <p className="small texto-gris mb-0">
                    Unidades disponibles: {formatNumber(inventario.unidadesDisponibles)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
