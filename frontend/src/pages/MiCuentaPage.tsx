import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileDown, MapPin, PackageCheck, Plus, ShoppingBag, UserRound } from 'lucide-react'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorAlert, mensajeDeError } from '../components/common/ErrorAlert'
import { Loading } from '../components/common/Loading'
import { PedidoBadge, UsuarioBadge } from '../components/common/StatusBadge'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Spinner } from '../components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { envioService } from '../services/envios'
import { pedidoService } from '../services/pedidos'
import { usuarioService } from '../services/usuarios'
import type {
  Direccion,
  DireccionRequest,
  PedidoResumen,
  Region,
  UsuarioActualizacionRequest,
} from '../types/api'
import { formatCLP, formatDate, formatDateTime } from '../utils/format'

type Tab = 'perfil' | 'direcciones' | 'pedidos'

const direccionInicial: DireccionRequest = {
  region: '',
  comuna: '',
  calle: '',
  numero: '',
  departamento: '',
  referencia: '',
  principal: false,
}

const selectClase =
  'flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-brand-light focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70 aria-invalid:border-destructive'

export function MiCuentaPage() {
  const { usuario, logout, actualizarUsuario, refrescarUsuario } = useAuth()
  const { mostrar } = useNotification()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('perfil')

  const [perfil, setPerfil] = useState<UsuarioActualizacionRequest>({
    nombre: '',
    apellido: '',
    rut: '',
    correo: '',
    telefono: '',
  })
  const [errorPerfil, setErrorPerfil] = useState<unknown>(null)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)

  const [regiones, setRegiones] = useState<Region[]>([])
  const [errorRegiones, setErrorRegiones] = useState<unknown>(null)
  const [modalDireccion, setModalDireccion] = useState(false)
  const [direccionEditando, setDireccionEditando] = useState<Direccion | null>(null)
  const [formDireccion, setFormDireccion] = useState<DireccionRequest>(direccionInicial)
  const [erroresDireccion, setErroresDireccion] = useState<Record<string, string>>({})
  const [errorDireccion, setErrorDireccion] = useState<unknown>(null)
  const [guardandoDireccion, setGuardandoDireccion] = useState(false)
  const [direccionAEliminar, setDireccionAEliminar] = useState<Direccion | null>(null)
  const [eliminandoDireccion, setEliminandoDireccion] = useState(false)

  const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
  const [cargandoPedidos, setCargandoPedidos] = useState(false)
  const [errorPedidos, setErrorPedidos] = useState<unknown>(null)
  const [descargandoId, setDescargandoId] = useState<number | null>(null)

  useEffect(() => {
    if (!usuario) return
    setPerfil({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rut: usuario.rut,
      correo: usuario.correo,
      telefono: usuario.telefono ?? '',
      rol: usuario.rol,
    })
  }, [usuario])

  useEffect(() => {
    let activo = true
    envioService
      .listarRegiones()
      .then((lista) => {
        if (activo) setRegiones(lista)
      })
      .catch((err: unknown) => {
        if (activo) setErrorRegiones(err)
      })
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    if (tab !== 'pedidos' || !usuario) return
    let activo = true
    setCargandoPedidos(true)
    setErrorPedidos(null)
    pedidoService
      .listarMios()
      .then((lista) => {
        if (activo) setPedidos(lista)
      })
      .catch((err: unknown) => {
        if (activo) setErrorPedidos(err)
      })
      .finally(() => {
        if (activo) setCargandoPedidos(false)
      })
    return () => {
      activo = false
    }
  }, [tab, usuario])

  if (!usuario) {
    return (
      <section className="py-12">
        <div className="container-page">
          <Loading texto="Cargando tu cuenta..." />
        </div>
      </section>
    )
  }

  const iniciales = `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase()

  const actualizarPerfil = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setPerfil((actual) => ({ ...actual, [name]: value }))
  }

  const guardarPerfil = async (event: FormEvent) => {
    event.preventDefault()
    setErrorPerfil(null)
    if (!perfil.nombre.trim() || !perfil.apellido.trim() || !perfil.rut.trim()) {
      setErrorPerfil(new Error('Nombre, apellido y RUT son obligatorios'))
      return
    }
    setGuardandoPerfil(true)
    try {
      const correoAnterior = usuario.correo
      const actualizado = await usuarioService.actualizar(usuario.id, {
        ...perfil,
        nombre: perfil.nombre.trim(),
        apellido: perfil.apellido.trim(),
        rut: perfil.rut.trim(),
        correo: perfil.correo.trim(),
        telefono: perfil.telefono?.trim() || undefined,
      })
      actualizarUsuario(actualizado)
      mostrar('Datos personales actualizados', 'success')
      if (actualizado.correo !== correoAnterior) {
        mostrar('El correo cambió. Inicia sesión nuevamente.', 'warning')
        logout()
        navigate('/login', { replace: true })
      }
    } catch (err: unknown) {
      setErrorPerfil(err)
    } finally {
      setGuardandoPerfil(false)
    }
  }

  const abrirNuevaDireccion = () => {
    setDireccionEditando(null)
    setFormDireccion({
      ...direccionInicial,
      principal: usuario.direcciones.length === 0,
    })
    setErroresDireccion({})
    setErrorDireccion(null)
    setModalDireccion(true)
  }

  const abrirEditarDireccion = (direccion: Direccion) => {
    setDireccionEditando(direccion)
    setFormDireccion({
      region: direccion.region,
      comuna: direccion.comuna,
      calle: direccion.calle,
      numero: direccion.numero,
      departamento: direccion.departamento ?? '',
      referencia: direccion.referencia ?? '',
      principal: direccion.principal,
    })
    setErroresDireccion({})
    setErrorDireccion(null)
    setModalDireccion(true)
  }

  const actualizarDireccion = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = event.target
    setFormDireccion((actual) => ({
      ...actual,
      [name]: type === 'checkbox' ? (event.target as HTMLInputElement).checked : value,
    }))
  }

  const regionSeleccionada = regiones.find((region) => region.nombre === formDireccion.region)

  const guardarDireccion = async (event: FormEvent) => {
    event.preventDefault()
    setErrorDireccion(null)
    const nuevos: Record<string, string> = {}
    if (!formDireccion.region) nuevos.region = 'Selecciona una región'
    if (!formDireccion.comuna) nuevos.comuna = 'Selecciona una comuna'
    if (!formDireccion.calle.trim()) nuevos.calle = 'La calle es obligatoria'
    if (!formDireccion.numero.trim()) nuevos.numero = 'El número es obligatorio'
    setErroresDireccion(nuevos)
    if (Object.keys(nuevos).length > 0) return

    setGuardandoDireccion(true)
    try {
      const datos: DireccionRequest = {
        ...formDireccion,
        region: formDireccion.region.trim(),
        comuna: formDireccion.comuna.trim(),
        calle: formDireccion.calle.trim(),
        numero: formDireccion.numero.trim(),
        departamento: formDireccion.departamento?.trim() || undefined,
        referencia: formDireccion.referencia?.trim() || undefined,
      }
      if (direccionEditando) {
        await usuarioService.actualizarDireccion(usuario.id, direccionEditando.id, datos)
        mostrar('Dirección actualizada', 'success')
      } else {
        await usuarioService.crearDireccion(usuario.id, datos)
        mostrar('Dirección agregada', 'success')
      }
      await refrescarUsuario()
      setModalDireccion(false)
    } catch (err: unknown) {
      setErrorDireccion(err)
    } finally {
      setGuardandoDireccion(false)
    }
  }

  const eliminarDireccion = async () => {
    if (!direccionAEliminar) return
    setEliminandoDireccion(true)
    try {
      await usuarioService.eliminarDireccion(usuario.id, direccionAEliminar.id)
      await refrescarUsuario()
      mostrar('Dirección eliminada', 'success')
      setDireccionAEliminar(null)
    } catch (err: unknown) {
      mostrar(mensajeDeError(err), 'danger')
    } finally {
      setEliminandoDireccion(false)
    }
  }

  const marcarPrincipal = async (direccion: Direccion) => {
    try {
      await usuarioService.marcarPrincipal(usuario.id, direccion.id)
      await refrescarUsuario()
      mostrar('Dirección principal actualizada', 'success')
    } catch (err: unknown) {
      mostrar(mensajeDeError(err), 'danger')
    }
  }

  const descargarComprobante = async (pedido: PedidoResumen) => {
    setDescargandoId(pedido.id)
    try {
      await pedidoService.descargarComprobante(pedido.id, pedido.numeroOrden)
      mostrar('Comprobante descargado', 'success')
    } catch (err: unknown) {
      mostrar(mensajeDeError(err), 'danger')
    } finally {
      setDescargandoId(null)
    }
  }

  const mensajeCampo = (campo: string) =>
    erroresDireccion[campo] ? <p className="field-error">{erroresDireccion[campo]}</p> : null

  return (
    <>
      <section className="py-8">
        <div className="container-page">
          <div className="mb-5 flex flex-wrap items-center gap-4">
            <span
              className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-brand to-olive font-display text-2xl font-bold text-white shadow-md"
              aria-hidden="true"
            >
              {iniciales}
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-brand-dark">
                {usuario.nombre} {usuario.apellido}
              </h1>
              <p className="text-sm text-muted-foreground">{usuario.correo}</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              <UsuarioBadge estado={usuario.estado} />
              <Badge variant="outline">
                {usuario.rol === 'administrador' ? 'Administrador' : 'Cliente'}
              </Badge>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(valor) => setTab(valor as Tab)}>
            <TabsList className="mb-5">
              <TabsTrigger value="perfil">
                <UserRound className="size-4" aria-hidden="true" />
                Datos personales
              </TabsTrigger>
              <TabsTrigger value="direcciones">
                <MapPin className="size-4" aria-hidden="true" />
                Direcciones
              </TabsTrigger>
              <TabsTrigger value="pedidos">
                <ShoppingBag className="size-4" aria-hidden="true" />
                Mis pedidos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="perfil">
              <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
                <form onSubmit={guardarPerfil}>
                  <Card className="gap-4 p-5 sm:p-6">
                    <h2 className="text-lg font-bold">Datos personales</h2>
                    {Boolean(errorPerfil) && (
                      <ErrorAlert error={errorPerfil} onClose={() => setErrorPerfil(null)} />
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="nombre">Nombre *</Label>
                        <Input
                          id="nombre"
                          name="nombre"
                          value={perfil.nombre}
                          onChange={actualizarPerfil}
                          maxLength={80}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="apellido">Apellido *</Label>
                        <Input
                          id="apellido"
                          name="apellido"
                          value={perfil.apellido}
                          onChange={actualizarPerfil}
                          maxLength={80}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="rut-perfil">RUT *</Label>
                        <Input
                          id="rut-perfil"
                          name="rut"
                          value={perfil.rut}
                          onChange={actualizarPerfil}
                          maxLength={20}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefono-perfil">Teléfono</Label>
                        <Input
                          id="telefono-perfil"
                          name="telefono"
                          type="tel"
                          value={perfil.telefono ?? ''}
                          onChange={actualizarPerfil}
                          maxLength={25}
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label htmlFor="correo-perfil">Correo electrónico *</Label>
                        <Input
                          id="correo-perfil"
                          name="correo"
                          type="email"
                          value={perfil.correo}
                          onChange={actualizarPerfil}
                          maxLength={150}
                          required
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Si cambias el correo deberás iniciar sesión nuevamente.
                        </p>
                      </div>
                    </div>
                    <Button type="submit" className="self-start" disabled={guardandoPerfil}>
                      {guardandoPerfil ? (
                        <>
                          <Spinner className="size-4" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar cambios'
                      )}
                    </Button>
                  </Card>
                </form>
                <Card className="h-fit gap-3 p-5">
                  <h2 className="text-sm font-bold">Información de la cuenta</h2>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Registro</dt>
                      <dd>{formatDate(usuario.fechaRegistro)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Rol</dt>
                      <dd>{usuario.rol === 'administrador' ? 'Administrador' : 'Cliente'}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Estado</dt>
                      <dd>{usuario.estado}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Correo</dt>
                      <dd>{usuario.correoConfirmado ? 'Confirmado' : 'Pendiente de confirmación'}</dd>
                    </div>
                  </dl>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="direcciones">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">Mis direcciones</h2>
                <Button type="button" variant="accent" onClick={abrirNuevaDireccion}>
                  <Plus className="size-4" aria-hidden="true" />
                  Agregar dirección
                </Button>
              </div>
              {Boolean(errorRegiones) && <ErrorAlert error={errorRegiones} />}
              {usuario.direcciones.length === 0 ? (
                <EmptyState
                  titulo="Aún no tienes direcciones"
                  descripcion="Agrega una dirección para agilizar tus próximas compras."
                  accion={
                    <Button type="button" onClick={abrirNuevaDireccion}>
                      Agregar mi primera dirección
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {usuario.direcciones.map((direccion) => (
                    <Card key={direccion.id} className="gap-2 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="flex items-center gap-1.5 font-bold">
                          <MapPin className="size-4 text-primary" aria-hidden="true" />
                          {direccion.calle} {direccion.numero}
                        </h3>
                        {direccion.principal && <Badge variant="success">Principal</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {direccion.comuna}, {direccion.region}
                      </p>
                      {direccion.departamento && (
                        <p className="text-sm text-muted-foreground">
                          Depto. {direccion.departamento}
                        </p>
                      )}
                      {direccion.referencia && (
                        <p className="text-sm text-muted-foreground">{direccion.referencia}</p>
                      )}
                      <div className="mt-auto flex flex-wrap gap-2 pt-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => abrirEditarDireccion(direccion)}
                        >
                          Editar
                        </Button>
                        {!direccion.principal && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => marcarPrincipal(direccion)}
                          >
                            Hacer principal
                          </Button>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setDireccionAEliminar(direccion)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="pedidos">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">Mis pedidos</h2>
                <Button asChild variant="outline">
                  <Link to="/productos">Seguir comprando</Link>
                </Button>
              </div>
              {Boolean(errorPedidos) && <ErrorAlert error={errorPedidos} />}
              {cargandoPedidos ? (
                <Loading texto="Cargando tus pedidos..." />
              ) : pedidos.length === 0 ? (
                <EmptyState
                  titulo="Todavía no tienes pedidos"
                  descripcion="Cuando realices tu primera compra aparecerá aquí."
                  accion={
                    <Button asChild>
                      <Link to="/productos">Ver productos</Link>
                    </Button>
                  }
                />
              ) : (
                <Card className="gap-3 p-4">
                  <div className="table-wrap">
                    <Table className="min-w-[760px]">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Orden</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Productos</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pedidos.map((pedido) => (
                          <TableRow key={pedido.id}>
                            <TableCell className="font-bold">{pedido.numeroOrden}</TableCell>
                            <TableCell>{formatDateTime(pedido.fechaCreacion)}</TableCell>
                            <TableCell>{pedido.cantidadProductos}</TableCell>
                            <TableCell>{formatCLP(pedido.total)}</TableCell>
                            <TableCell>
                              <PedidoBadge estado={pedido.estado} />
                              <span className="mt-1 block text-xs text-muted-foreground">
                                Pago: {pedido.estadoPago}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-wrap justify-end gap-2">
                                <Button asChild size="sm" variant="outline">
                                  <Link to={`/pedido/${pedido.id}`}>Ver detalle</Link>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => descargarComprobante(pedido)}
                                  disabled={descargandoId === pedido.id}
                                >
                                  {descargandoId === pedido.id ? (
                                    <>
                                      <Spinner className="size-3.5" />
                                      Descargando...
                                    </>
                                  ) : (
                                    <>
                                      <FileDown className="size-3.5" aria-hidden="true" />
                                      Comprobante
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex flex-wrap gap-3 border-t border-border pt-5">
            <Button asChild variant="outline">
              <Link to="/productos">
                <PackageCheck className="size-4" aria-hidden="true" />
                Seguir comprando
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Dialog open={modalDireccion} onOpenChange={(abierto) => setModalDireccion(abierto)}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{direccionEditando ? 'Editar dirección' : 'Nueva dirección'}</DialogTitle>
            <DialogDescription>
              Completa los datos para guardar tu dirección de despacho.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={guardarDireccion}>
            {Boolean(errorDireccion) && (
              <ErrorAlert error={errorDireccion} onClose={() => setErrorDireccion(null)} />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="region-direccion">Región *</Label>
                <select
                  id="region-direccion"
                  name="region"
                  className={selectClase}
                  value={formDireccion.region}
                  onChange={(event) => {
                    setFormDireccion((actual) => ({
                      ...actual,
                      region: event.target.value,
                      comuna: '',
                    }))
                  }}
                  required
                  aria-invalid={erroresDireccion.region ? true : undefined}
                >
                  <option value="">Selecciona una región</option>
                  {regiones.map((region) => (
                    <option key={region.codigo} value={region.nombre}>
                      {region.nombre}
                    </option>
                  ))}
                </select>
                {mensajeCampo('region')}
              </div>
              <div>
                <Label htmlFor="comuna-direccion">Comuna *</Label>
                <select
                  id="comuna-direccion"
                  name="comuna"
                  className={selectClase}
                  value={formDireccion.comuna}
                  onChange={actualizarDireccion}
                  disabled={!regionSeleccionada}
                  required
                  aria-invalid={erroresDireccion.comuna ? true : undefined}
                >
                  <option value="">Selecciona una comuna</option>
                  {regionSeleccionada?.comunas.map((comuna) => (
                    <option key={comuna.id} value={comuna.nombre}>
                      {comuna.nombre}
                    </option>
                  ))}
                </select>
                {mensajeCampo('comuna')}
              </div>
              <div className="sm:col-span-2 sm:grid sm:grid-cols-[1fr_8rem] sm:gap-4">
                <div>
                  <Label htmlFor="calle">Calle *</Label>
                  <Input
                    id="calle"
                    name="calle"
                    value={formDireccion.calle}
                    onChange={actualizarDireccion}
                    maxLength={150}
                    required
                    aria-invalid={erroresDireccion.calle ? true : undefined}
                  />
                  {mensajeCampo('calle')}
                </div>
                <div>
                  <Label htmlFor="numero">Número *</Label>
                  <Input
                    id="numero"
                    name="numero"
                    value={formDireccion.numero}
                    onChange={actualizarDireccion}
                    maxLength={20}
                    required
                    aria-invalid={erroresDireccion.numero ? true : undefined}
                  />
                  {mensajeCampo('numero')}
                </div>
              </div>
              <div>
                <Label htmlFor="departamento">Departamento / casa</Label>
                <Input
                  id="departamento"
                  name="departamento"
                  value={formDireccion.departamento ?? ''}
                  onChange={actualizarDireccion}
                  maxLength={50}
                />
              </div>
              <div>
                <Label htmlFor="referencia">Referencia</Label>
                <Input
                  id="referencia"
                  name="referencia"
                  value={formDireccion.referencia ?? ''}
                  onChange={actualizarDireccion}
                  maxLength={250}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                id="principal"
                name="principal"
                checked={formDireccion.principal}
                onChange={actualizarDireccion}
                className="size-4 accent-primary"
              />
              Usar como dirección principal
            </label>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalDireccion(false)}
                disabled={guardandoDireccion}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardandoDireccion}>
                {guardandoDireccion ? (
                  <>
                    <Spinner className="size-4" />
                    Guardando...
                  </>
                ) : (
                  'Guardar dirección'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        abierto={Boolean(direccionAEliminar)}
        titulo="Eliminar dirección"
        textoConfirmar="Eliminar"
        ocupado={eliminandoDireccion}
        onConfirmar={eliminarDireccion}
        onCancelar={() => setDireccionAEliminar(null)}
      >
        <p className="mb-0">
          ¿Quieres eliminar la dirección{' '}
          <strong>
            {direccionAEliminar?.calle} {direccionAEliminar?.numero}
          </strong>
          ? Esta acción no se puede deshacer.
        </p>
      </ConfirmModal>
    </>
  )
}
