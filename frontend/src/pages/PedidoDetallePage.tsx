import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { CheckCircle2, CreditCard, FileDown, Info, MapPin, Truck } from 'lucide-react'
import { ErrorAlert, mensajeDeError } from '../components/common/ErrorAlert'
import { Loading } from '../components/common/Loading'
import { PedidoBadge } from '../components/common/StatusBadge'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
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
      <section className="py-12">
        <div className="container-page">
          <Loading texto="Cargando pedido..." />
        </div>
      </section>
    )
  }

  if (error || !pedido) {
    return (
      <section className="py-12">
        <div className="container-page">
          <ErrorAlert error={error ?? new Error('No encontramos el pedido solicitado')} />
          <div className="text-center">
            <Button asChild>
              <Link to="/mi-cuenta">Volver a mi cuenta</Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8">
      <div className="container-page">
        {esNuevo && (
          <Alert variant="success" className="mb-5">
            <CheckCircle2 aria-hidden="true" />
            <AlertTitle>¡Gracias por tu compra!</AlertTitle>
            <AlertDescription>
              Tu pedido <strong>{pedido.numeroOrden}</strong> fue registrado correctamente. El pago
              es simulado en esta versión y el comprobante ya está disponible.
            </AlertDescription>
          </Alert>
        )}

        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">
              Pedido {pedido.numeroOrden}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Realizado el {formatDateTime(pedido.fechaCreacion)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PedidoBadge estado={pedido.estado} />
            <Badge variant="outline">Pago: {pedido.estadoPago}</Badge>
            <Button type="button" onClick={descargarComprobante} disabled={descargando}>
              {descargando ? (
                <Spinner className="size-4" />
              ) : (
                <FileDown className="size-4" aria-hidden="true" />
              )}
              Descargar comprobante
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-4">
            <Card className="gap-3 p-5">
              <h2 className="text-lg font-bold">Productos</h2>
              <div className="table-wrap">
                <Table className="min-w-[560px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Producto</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedido.items.map((item) => (
                      <TableRow key={item.productoId}>
                        <TableCell className="whitespace-normal">{item.nombreProducto}</TableCell>
                        <TableCell>{formatCLP(item.precioUnitario)}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCLP(item.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={3} className="text-right font-normal">
                        Subtotal productos
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {formatCLP(pedido.subtotal)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={3} className="text-right font-normal">
                        Costo de envío
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {Number(pedido.costoEnvio) === 0
                          ? 'Sin costo'
                          : formatCLP(pedido.costoEnvio)}
                      </TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={3} className="text-right font-bold">
                        Total
                      </TableCell>
                      <TableCell className="text-right text-base font-extrabold text-primary">
                        {formatCLP(pedido.total)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="gap-2 p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <Truck className="size-4 text-primary" aria-hidden="true" />
                  Despacho
                </h2>
                <p className="font-semibold">{pedido.metodoDespachoNombre}</p>
                <p className="text-xs text-muted-foreground">
                  {pedido.diasHabiles} día{pedido.diasHabiles === 1 ? '' : 's'} hábil
                  {pedido.diasHabiles === 1 ? '' : 'es'}
                </p>
                {pedido.requiereDireccion ? (
                  <p className="flex items-start gap-1.5 text-sm">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {pedido.direccion}
                      <br />
                      {pedido.comuna}
                      {pedido.regionNombre ? `, ${pedido.regionNombre}` : ''}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Retiro presencial en nuestras instalaciones. Te contactaremos para coordinar.
                  </p>
                )}
              </Card>
              <Card className="gap-2 p-5">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <CreditCard className="size-4 text-primary" aria-hidden="true" />
                  Pago
                </h2>
                <p>{pedido.metodoPago}</p>
                <p className="text-xs text-muted-foreground">Estado: {pedido.estadoPago}</p>
                {pedido.referenciaPago && (
                  <p className="text-sm">
                    Referencia:{' '}
                    <span className="font-mono text-xs">{pedido.referenciaPago}</span>
                  </p>
                )}
                {pedido.pagoSimulado && (
                  <p className="flex items-center gap-1.5 text-xs text-emerald-700">
                    <Info className="size-3.5" aria-hidden="true" />
                    Pago simulado para esta versión local.
                  </p>
                )}
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="gap-2 p-5">
              <h2 className="text-sm font-bold">Datos del comprador</h2>
              <p>
                {pedido.nombre} {pedido.apellido}
              </p>
              <p className="text-xs text-muted-foreground">{pedido.correo}</p>
              {pedido.telefono && <p className="text-xs text-muted-foreground">{pedido.telefono}</p>}
              {pedido.rut && <p className="text-xs text-muted-foreground">RUT: {pedido.rut}</p>}
            </Card>

            <Card className="gap-2 p-5">
              <h2 className="text-sm font-bold">Documento</h2>
              <p>{pedido.documentoTipo}</p>
              {pedido.documentoTipo.toLowerCase() === 'factura' && (
                <>
                  <p className="text-xs text-muted-foreground">RUT: {pedido.rutFacturacion}</p>
                  <p className="text-xs text-muted-foreground">{pedido.razonSocial}</p>
                  <p className="text-xs text-muted-foreground">Giro: {pedido.giro}</p>
                </>
              )}
            </Card>

            <div className="grid gap-2">
              <Button asChild variant="outline">
                <Link to="/mi-cuenta">Ver mis pedidos</Link>
              </Button>
              <Button asChild>
                <Link to="/productos">Seguir comprando</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
