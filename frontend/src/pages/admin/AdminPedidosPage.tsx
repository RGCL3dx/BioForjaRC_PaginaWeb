import { useCallback, useEffect, useState } from 'react'
import { FileDown, Search } from 'lucide-react'
import { ErrorAlert, mensajeDeError } from '../../components/common/ErrorAlert'
import { EmptyState } from '../../components/common/EmptyState'
import { Loading } from '../../components/common/Loading'
import { Pagination } from '../../components/common/Pagination'
import { PedidoBadge } from '../../components/common/StatusBadge'
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

const selectClase =
  'flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-brand-light focus-visible:ring-2 focus-visible:ring-ring/30'

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
      <section className="pt-10 pb-6">
        <div className="container-page text-center">
          <h1 className="section-title">Pedidos</h1>
          <p className="page-intro mb-0">
            Revisa las compras, descarga comprobantes y actualiza el estado de despacho.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page">
          <Card className="gap-4 p-4 sm:p-5">
            <form
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
              onSubmit={(event) => {
                event.preventDefault()
                setQ(qInput)
                setPagina(0)
              }}
            >
              <div>
                <Label htmlFor="buscar-pedido">Buscar</Label>
                <Input
                  id="buscar-pedido"
                  type="search"
                  placeholder="Orden, cliente o correo"
                  value={qInput}
                  onChange={(event) => setQInput(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estado-pedido">Estado</Label>
                <select
                  id="estado-pedido"
                  className={selectClase}
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
              <div>
                <Label htmlFor="pedido-desde">Desde</Label>
                <Input
                  id="pedido-desde"
                  type="date"
                  value={desde}
                  onChange={(event) => {
                    setDesde(event.target.value)
                    setPagina(0)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="pedido-hasta">Hasta</Label>
                <Input
                  id="pedido-hasta"
                  type="date"
                  value={hasta}
                  onChange={(event) => {
                    setHasta(event.target.value)
                    setPagina(0)
                  }}
                />
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
                    setEstado('')
                    setDesde('')
                    setHasta('')
                    setPagina(0)
                  }}
                >
                  Limpiar
                </Button>
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
                <div className="table-wrap">
                  <Table className="min-w-[980px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Orden</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Pago</TableHead>
                        <TableHead>Despacho</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pedidos.contenido.map((pedido) => (
                        <TableRow key={pedido.id}>
                          <TableCell className="font-bold">{pedido.numeroOrden}</TableCell>
                          <TableCell>{formatDateTime(pedido.fechaCreacion)}</TableCell>
                          <TableCell className="whitespace-normal">
                            <span className="block">{pedido.cliente}</span>
                            <span className="block text-xs text-muted-foreground">
                              {pedido.correo}
                            </span>
                          </TableCell>
                          <TableCell>{formatCLP(pedido.total)}</TableCell>
                          <TableCell>
                            <span className="block text-xs">{pedido.metodoPago}</span>
                            <Badge variant="outline" className="mt-1">
                              {pedido.estadoPago}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{pedido.metodoDespacho}</TableCell>
                          <TableCell>
                            <PedidoBadge estado={pedido.estado} />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void verDetalle(pedido)}
                            >
                              Ver detalle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">
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
          </Card>
        </div>
      </section>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detalle ? `Pedido ${detalle.numeroOrden}` : 'Detalle del pedido'}
            </DialogTitle>
            <DialogDescription>
              Revisa los datos del pedido y actualiza el estado de despacho.
            </DialogDescription>
          </DialogHeader>

          {cargandoDetalle ? (
            <Loading texto="Cargando pedido..." />
          ) : errorDetalle ? (
            <ErrorAlert error={errorDetalle} onClose={() => setErrorDetalle(null)} />
          ) : detalle ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <h3 className="text-sm font-bold">Cliente</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
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
                <div>
                  <h3 className="text-sm font-bold">Despacho</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
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
                <div>
                  <h3 className="text-sm font-bold">Pago y documento</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
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

              <div>
                <h3 className="mb-2 text-sm font-bold">Productos</h3>
                <div className="table-wrap">
                  <Table className="min-w-[520px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Producto</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detalle.items.map((item) => (
                        <TableRow key={item.productoId}>
                          <TableCell className="whitespace-normal">{item.nombreProducto}</TableCell>
                          <TableCell>{formatCLP(item.precioUnitario)}</TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell className="text-right">{formatCLP(item.subtotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <dl className="ml-auto w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd>{formatCLP(detalle.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Envío</dt>
                  <dd>{formatCLP(detalle.costoEnvio)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-border pt-1 font-bold">
                  <dt>Total</dt>
                  <dd>{formatCLP(detalle.total)}</dd>
                </div>
              </dl>

              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-end">
                <div className="sm:w-64">
                  <Label htmlFor="nuevo-estado">Estado de despacho</Label>
                  <select
                    id="nuevo-estado"
                    className={selectClase}
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
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={guardarEstado}
                    disabled={guardandoEstado || nuevoEstado === detalle.estado}
                  >
                    {guardandoEstado ? 'Guardando...' : 'Actualizar estado'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={descargarComprobante}
                    disabled={descargando}
                  >
                    <FileDown className="size-4" aria-hidden="true" />
                    {descargando ? 'Descargando...' : 'Descargar comprobante'}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setModalAbierto(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
