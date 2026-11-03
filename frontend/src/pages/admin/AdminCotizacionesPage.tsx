import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Download, FileText, Link2, Search } from 'lucide-react'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorAlert, mensajeDeError } from '../../components/common/ErrorAlert'
import { Loading } from '../../components/common/Loading'
import { Pagination } from '../../components/common/Pagination'
import { CotizacionBadge } from '../../components/common/StatusBadge'
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

const selectClase =
  'flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-brand-light focus-visible:ring-2 focus-visible:ring-ring/30'

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
      <section className="pt-10 pb-6">
        <div className="container-page text-center">
          <h1 className="section-title">Cotizaciones</h1>
          <p className="page-intro mb-0">
            Revisa solicitudes, descarga archivos 3D y asigna monto y plazo de entrega.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page">
          <Card className="gap-4 p-4 sm:p-5">
            <form
              className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr_auto]"
              onSubmit={(event) => {
                event.preventDefault()
                setQ(qInput)
                setPagina(0)
              }}
            >
              <div>
                <Label htmlFor="buscar-cotizacion">Buscar</Label>
                <Input
                  id="buscar-cotizacion"
                  type="search"
                  placeholder="Ticket, cliente o correo"
                  value={qInput}
                  onChange={(event) => setQInput(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="estado-cotizacion">Estado</Label>
                <select
                  id="estado-cotizacion"
                  className={selectClase}
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
              <div>
                <Label htmlFor="cotizacion-desde">Desde</Label>
                <Input
                  id="cotizacion-desde"
                  type="date"
                  value={desde}
                  onChange={(event) => {
                    setDesde(event.target.value)
                    setPagina(0)
                  }}
                />
              </div>
              <div>
                <Label htmlFor="cotizacion-hasta">Hasta</Label>
                <Input
                  id="cotizacion-hasta"
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
              <Loading texto="Cargando cotizaciones..." />
            ) : !cotizaciones || cotizaciones.contenido.length === 0 ? (
              <EmptyState
                titulo="No hay cotizaciones que coincidan"
                descripcion="Las solicitudes enviadas desde el formulario público aparecerán aquí."
              />
            ) : (
              <>
                <div className="table-wrap">
                  <Table className="min-w-[1100px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Ticket</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Archivos</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Presupuesto</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cotizaciones.contenido.map((cotizacion) => (
                        <TableRow key={cotizacion.id}>
                          <TableCell className="font-mono font-bold">
                            {cotizacion.numeroTicket}
                          </TableCell>
                          <TableCell>{formatDateTime(cotizacion.fechaCreacion)}</TableCell>
                          <TableCell className="whitespace-normal">
                            <span className="block">
                              {cotizacion.nombre} {cotizacion.apellido}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {cotizacion.correo}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs">{cotizacion.categoria}</TableCell>
                          <TableCell>{cotizacion.cantidad ?? '—'}</TableCell>
                          <TableCell>{cotizacion.cantidadArchivos}</TableCell>
                          <TableCell>
                            <CotizacionBadge estado={cotizacion.estado} />
                          </TableCell>
                          <TableCell>
                            {cotizacion.montoTotal ? formatCLP(cotizacion.montoTotal) : '—'}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void verDetalle(cotizacion)}
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
          </Card>
        </div>
      </section>

      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detalle ? `Cotización ${detalle.numeroTicket}` : 'Detalle de cotización'}
            </DialogTitle>
            <DialogDescription>
              Revisa la solicitud, descarga los archivos y define el presupuesto.
            </DialogDescription>
          </DialogHeader>

          {cargandoDetalle ? (
            <Loading texto="Cargando cotización..." />
          ) : errorDetalle ? (
            <ErrorAlert error={errorDetalle} onClose={() => setErrorDetalle(null)} />
          ) : detalle ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <h3 className="text-sm font-bold">Solicitante</h3>
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
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Proyecto</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Categoría: {detalle.categoria}
                    <br />
                    Cantidad: {detalle.cantidad ?? 'No indicada'}
                    <br />
                    Plazo: {detalle.plazo || 'Sin preferencia'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-bold">Estado</h3>
                  <div className="mt-1 space-y-1 text-sm text-muted-foreground">
                    <CotizacionBadge estado={detalle.estado} />
                    <p className="mb-0">Creada: {formatDateTime(detalle.fechaCreacion)}</p>
                    {detalle.fechaPresupuesto && (
                      <p className="mb-0">
                        Presupuestada: {formatDateTime(detalle.fechaPresupuesto)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold">Descripción</h3>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {detalle.descripcion}
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-bold">Archivos 3D</h3>
                {detalle.archivos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No se adjuntaron archivos.</p>
                ) : (
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {detalle.archivos.map((archivo) => (
                      <li
                        key={archivo.id}
                        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5"
                      >
                        <span className="flex items-center gap-2 text-sm">
                          <FileText className="size-4 text-brand" aria-hidden="true" />
                          {archivo.nombreOriginal}{' '}
                          <span className="text-xs text-muted-foreground">
                            ({archivo.tamanoLegible} · {archivo.extension})
                          </span>
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void descargarArchivo(archivo.id, archivo.nombreOriginal)}
                          disabled={descargandoArchivo === archivo.id}
                        >
                          <Download className="size-4" aria-hidden="true" />
                          {descargandoArchivo === archivo.id ? 'Descargando...' : 'Descargar'}
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-bold">Presupuesto</h3>
                {detalle.estado === 'Presupuestada' ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <span className="block text-xs text-muted-foreground">Monto total</span>
                      <strong>{formatCLP(detalle.montoTotal ?? 0)}</strong>
                    </div>
                    <div>
                      <span className="block text-xs text-muted-foreground">Plazo de entrega</span>
                      <strong>{detalle.plazoEntregaDias ?? '—'} días</strong>
                    </div>
                    <div>
                      <span className="block text-xs text-muted-foreground">Observaciones</span>
                      <span className="text-sm">
                        {detalle.observacionesPresupuesto || 'Sin observaciones'}
                      </span>
                    </div>
                    {detalle.enlacePago && (
                      <div className="sm:col-span-3">
                        <Button asChild>
                          <a href={detalle.enlacePago} target="_blank" rel="noreferrer">
                            <Link2 className="size-4" aria-hidden="true" />
                            Abrir enlace de pago
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <form className="grid gap-4 sm:grid-cols-2" onSubmit={guardarPresupuesto}>
                    {Boolean(errorPresupuesto) && (
                      <div className="sm:col-span-2">
                        <ErrorAlert
                          error={errorPresupuesto}
                          onClose={() => setErrorPresupuesto(null)}
                        />
                      </div>
                    )}
                    <div>
                      <Label htmlFor="monto-total">Monto total (CLP) *</Label>
                      <Input
                        id="monto-total"
                        type="number"
                        min={0}
                        step={1}
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
                    <div>
                      <Label htmlFor="plazo-entrega">Plazo de entrega (días) *</Label>
                      <Input
                        id="plazo-entrega"
                        type="number"
                        min={1}
                        max={365}
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
                    <div className="sm:col-span-2">
                      <Label htmlFor="observaciones-presupuesto">Observaciones</Label>
                      <Textarea
                        id="observaciones-presupuesto"
                        rows={3}
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
                    <div className="sm:col-span-2">
                      <Button type="submit" variant="accent" disabled={guardandoPresupuesto}>
                        {guardandoPresupuesto ? 'Guardando...' : 'Guardar presupuesto'}
                      </Button>
                    </div>
                  </form>
                )}
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
