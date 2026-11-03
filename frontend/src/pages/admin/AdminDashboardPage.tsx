import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Boxes,
  Download,
  Mail,
  Package,
  Receipt,
  RefreshCw,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react'
import { ErrorAlert, mensajeDeError } from '../../components/common/ErrorAlert'
import { Loading } from '../../components/common/Loading'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
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
      <section className="py-12">
        <div className="container-page">
          <Loading texto="Cargando panel de administración..." />
        </div>
      </section>
    )
  }

  const metricas = [
    {
      titulo: 'Ventas',
      valor: formatCLP(reporte?.totalVentas ?? 0),
      icono: TrendingUp,
      extra: null as string | null,
    },
    {
      titulo: 'Pedidos',
      valor: formatNumber(reporte?.cantidadPedidos ?? 0),
      icono: Boxes,
      extra: null,
    },
    {
      titulo: 'Ticket promedio',
      valor: formatCLP(reporte?.ticketPromedio ?? 0),
      icono: Receipt,
      extra: null,
    },
    {
      titulo: 'Productos',
      valor: formatNumber(inventario?.totalProductos ?? 0),
      icono: Package,
      extra:
        inventario && inventario.stockBajo > 0 ? `${inventario.stockBajo} con stock bajo` : null,
    },
    {
      titulo: 'Usuarios',
      valor: formatNumber(usuarios.length),
      icono: Users,
      extra: null,
    },
    {
      titulo: 'Cotizaciones',
      valor: formatNumber(totalCotizaciones),
      icono: Mail,
      extra: null,
    },
  ]

  return (
    <section className="py-8">
      <div className="container-page">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">
              Panel de administración
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Resumen de actividad de tu tienda BioForjaRC.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void cargar()}>
              <RefreshCw className="size-4" aria-hidden="true" />
              Actualizar
            </Button>
            <Button
              type="button"
              onClick={() => void exportar('xlsx')}
              disabled={exportando !== null}
            >
              <Download className="size-4" aria-hidden="true" />
              {exportando === 'xlsx' ? 'Exportando...' : 'Exportar Excel'}
            </Button>
            <Button
              type="button"
              onClick={() => void exportar('pdf')}
              disabled={exportando !== null}
            >
              <Download className="size-4" aria-hidden="true" />
              {exportando === 'pdf' ? 'Exportando...' : 'Exportar PDF'}
            </Button>
          </div>
        </div>

        {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}

        <Card className="mb-5 gap-0 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="reporte-desde">Desde</Label>
              <Input
                id="reporte-desde"
                type="date"
                value={desde}
                onChange={(event) => setDesde(event.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="reporte-hasta">Hasta</Label>
              <Input
                id="reporte-hasta"
                type="date"
                value={hasta}
                onChange={(event) => setHasta(event.target.value)}
              />
            </div>
            <Button type="button" onClick={() => void cargar()} disabled={cargando}>
              {cargando ? 'Cargando...' : 'Aplicar rango'}
            </Button>
          </div>
        </Card>

        <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {metricas.map((metrica) => {
            const Icono = metrica.icono
            return (
              <Card key={metrica.titulo} className="gap-1 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                      {metrica.titulo}
                    </h2>
                    <p className="mt-1 font-display text-xl font-bold text-primary">
                      {metrica.valor}
                    </p>
                  </div>
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Icono className="size-4" aria-hidden="true" />
                  </span>
                </div>
                {metrica.extra && (
                  <Badge variant="warning" className="mt-1 self-start">
                    {metrica.extra}
                  </Badge>
                )}
              </Card>
            )
          })}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Card className="gap-3 p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Trophy className="size-5 text-amber-brand" aria-hidden="true" />
              Productos más vendidos
            </h2>
            {reporte && reporte.topProductos.length > 0 ? (
              <div className="table-wrap">
                <Table className="min-w-[480px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Producto</TableHead>
                      <TableHead>Unidades</TableHead>
                      <TableHead>Ingresos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporte.topProductos.map((producto) => (
                      <TableRow key={producto.productoId ?? producto.nombre}>
                        <TableCell className="whitespace-normal">{producto.nombre}</TableCell>
                        <TableCell>{formatNumber(producto.unidades)}</TableCell>
                        <TableCell className="font-bold">
                          {formatCLP(producto.ingresos)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay ventas registradas en el período seleccionado.
              </p>
            )}
          </Card>

          <div className="space-y-4">
            <Card className="gap-3 p-5">
              <h2 className="text-lg font-bold">Accesos rápidos</h2>
              <div className="grid gap-2">
                {[
                  { to: '/admin/inventario', label: 'Gestionar inventario', icono: Package },
                  { to: '/admin/pedidos', label: 'Revisar pedidos', icono: Boxes },
                  { to: '/admin/usuarios', label: 'Administrar usuarios', icono: Users },
                  { to: '/admin/cotizaciones', label: 'Ver cotizaciones', icono: Mail },
                ].map((acceso) => {
                  const Icono = acceso.icono
                  return (
                    <Button
                      key={acceso.to}
                      asChild
                      variant="outline"
                      className="justify-between"
                    >
                      <Link to={acceso.to}>
                        <span className="flex items-center gap-2">
                          <Icono className="size-4" aria-hidden="true" />
                          {acceso.label}
                        </span>
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  )
                })}
              </div>
            </Card>

            <Card className="gap-2 p-5">
              <h2 className="text-sm font-bold">Rango del reporte</h2>
              <p className="text-xs text-muted-foreground">
                Desde {formatDate(desde)} hasta {formatDate(hasta)}
              </p>
              <p className="text-xs text-muted-foreground">
                Unidades vendidas: {formatNumber(reporte?.unidadesVendidas ?? 0)}
              </p>
              {inventario && (
                <p className="text-xs text-muted-foreground">
                  Unidades disponibles: {formatNumber(inventario.unidadesDisponibles)}
                </p>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
