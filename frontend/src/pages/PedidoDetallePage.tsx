import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ErrorAlert, mensajeDeError } from '../components/common/ErrorAlert'
import { Loading } from '../components/common/Loading'
import { PedidoBadge } from '../components/common/StatusBadge'
import { useNotification } from '../context/NotificationContext'
import { pedidoService } from '../services/pedidos'
import type { PedidoDetalle } from '../types/api'
import { formatCLP, formatDateTime } from '../utils/format'

export function PedidoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { mostrar } = useNotification()
  const [pedido, setPedido] = useState<PedidoDetalle | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const [descargando, setDescargando] = useState(false)
  const esNuevo = Boolean((location.state as { nuevo?: boolean } | null)?.nuevo)

  useEffect(() => {
    const pedidoId = Number(id)
    if (!Number.isFinite(pedidoId) || pedidoId <= 0) {
      setError(new Error('El pedido solicitado no es válido'))
      setCargando(false)
      return
    }
    let activo = true
    pedidoService
      .obtener(pedidoId)
      .then((detalle) => {
        if (activo) setPedido(detalle)
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

  const descargarComprobante = async () => {
    if (!pedido) return
    setDescargando(true)
    try {
      await pedidoService.descargarComprobante(pedido.id, pedido.numeroOrden)
      mostrar('Comprobante descargado', 'success')
    } catch (err: unknown) {
      mostrar(mensajeDeError(err), 'danger')
    } finally {
      setDescargando(false)
    }
  }

  if (cargando) {
    return (
      <section className="py-5">
        <div className="container">
          <Loading texto="Cargando pedido..." />
        </div>
      </section>
    )
  }

  if (error || !pedido) {
    return (
      <section className="py-5">
        <div className="container">
          <ErrorAlert error={error ?? new Error('No encontramos el pedido solicitado')} />
          <div className="text-center">
            <Link to="/mi-cuenta" className="btn btn-marca rounded-pill">
              Volver a mi cuenta
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="py-5">
        <div className="container">
          {esNuevo && (
            <div className="alert alert-success d-flex gap-3 align-items-start mb-4" role="status">
              <i className="bi bi-check-circle-fill fs-3" aria-hidden="true" />
              <div>
                <h2 className="h5 alert-heading mb-1">¡Gracias por tu compra!</h2>
                <p className="mb-0">
                  Tu pedido <strong>{pedido.numeroOrden}</strong> fue registrado correctamente. El
                  pago es simulado en esta versión y el comprobante ya está disponible.
                </p>
              </div>
            </div>
          )}

          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
            <div>
              <h1 className="titulo-seccion text-start mb-2">Pedido {pedido.numeroOrden}</h1>
              <p className="texto-gris mb-0">Realizado el {formatDateTime(pedido.fechaCreacion)}</p>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <PedidoBadge estado={pedido.estado} />
              <span className="badge rounded-pill text-bg-light border">
                Pago: {pedido.estadoPago}
              </span>
              <button
                type="button"
                className="btn btn-marca rounded-pill"
                onClick={descargarComprobante}
                disabled={descargando}
              >
                {descargando ? (
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                ) : (
                  <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true" />
                )}
                Descargar comprobante
              </button>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card card-formulario p-4 mb-4">
                <h2 className="h5 fw-bold mb-3">Productos</h2>
                <div className="table-responsive">
                  <table className="table align-middle tabla-marca mb-0">
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
                      {pedido.items.map((item) => (
                        <tr key={item.productoId}>
                          <td>{item.nombreProducto}</td>
                          <td>{formatCLP(item.precioUnitario)}</td>
                          <td>{item.cantidad}</td>
                          <td className="text-end fw-bold">{formatCLP(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan={3} className="text-end">
                          Subtotal productos
                        </th>
                        <th className="text-end">{formatCLP(pedido.subtotal)}</th>
                      </tr>
                      <tr>
                        <th colSpan={3} className="text-end">
                          Costo de envío
                        </th>
                        <th className="text-end">
                          {Number(pedido.costoEnvio) === 0 ? 'Sin costo' : formatCLP(pedido.costoEnvio)}
                        </th>
                      </tr>
                      <tr>
                        <th colSpan={3} className="text-end">
                          Total
                        </th>
                        <th className="text-end fs-5">{formatCLP(pedido.total)}</th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="card card-formulario p-4 h-100">
                    <h2 className="h6 fw-bold">
                      <i className="bi bi-truck me-2 texto-marca" aria-hidden="true" />
                      Despacho
                    </h2>
                    <p className="mb-1 fw-bold">{pedido.metodoDespachoNombre}</p>
                    <p className="texto-gris small mb-2">
                      {pedido.diasHabiles} día{pedido.diasHabiles === 1 ? '' : 's'} hábil
                      {pedido.diasHabiles === 1 ? '' : 'es'}
                    </p>
                    {pedido.requiereDireccion ? (
                      <p className="mb-0 small">
                        {pedido.direccion}
                        <br />
                        {pedido.comuna}
                        {pedido.regionNombre ? `, ${pedido.regionNombre}` : ''}
                      </p>
                    ) : (
                      <p className="mb-0 small">
                        Retiro presencial en nuestras instalaciones. Te contactaremos para coordinar.
                      </p>
                    )}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card card-formulario p-4 h-100">
                    <h2 className="h6 fw-bold">
                      <i className="bi bi-credit-card me-2 texto-marca" aria-hidden="true" />
                      Pago
                    </h2>
                    <p className="mb-1">{pedido.metodoPago}</p>
                    <p className="texto-gris small mb-2">Estado: {pedido.estadoPago}</p>
                    {pedido.referenciaPago && (
                      <p className="small mb-2">
                        Referencia: <span className="font-monospace">{pedido.referenciaPago}</span>
                      </p>
                    )}
                    {pedido.pagoSimulado && (
                      <p className="small text-success mb-0">
                        <i className="bi bi-info-circle me-1" aria-hidden="true" />
                        Pago simulado para esta versión local.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card card-formulario p-4 mb-4">
                <h2 className="h6 fw-bold">Datos del comprador</h2>
                <p className="mb-1">
                  {pedido.nombre} {pedido.apellido}
                </p>
                <p className="small texto-gris mb-1">{pedido.correo}</p>
                {pedido.telefono && <p className="small texto-gris mb-1">{pedido.telefono}</p>}
                {pedido.rut && <p className="small texto-gris mb-0">RUT: {pedido.rut}</p>}
              </div>

              <div className="card card-formulario p-4 mb-4">
                <h2 className="h6 fw-bold">Documento</h2>
                <p className="mb-1">{pedido.documentoTipo}</p>
                {pedido.documentoTipo.toLowerCase() === 'factura' && (
                  <>
                    <p className="small texto-gris mb-1">RUT: {pedido.rutFacturacion}</p>
                    <p className="small texto-gris mb-1">{pedido.razonSocial}</p>
                    <p className="small texto-gris mb-0">Giro: {pedido.giro}</p>
                  </>
                )}
              </div>

              <div className="d-grid gap-2">
                <Link to="/mi-cuenta" className="btn btn-marca-outline rounded-pill">
                  Ver mis pedidos
                </Link>
                <Link to="/productos" className="btn btn-marca rounded-pill">
                  Seguir comprando
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
