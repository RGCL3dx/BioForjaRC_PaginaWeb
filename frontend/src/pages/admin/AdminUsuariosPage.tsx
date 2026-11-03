import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Search, ShieldCheck, Users } from 'lucide-react'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorAlert, mensajeDeError } from '../../components/common/ErrorAlert'
import { Loading } from '../../components/common/Loading'
import { UsuarioBadge } from '../../components/common/StatusBadge'
import { Alert, AlertDescription } from '../../components/ui/alert'
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
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { usuarioService } from '../../services/usuarios'
import type { EstadoUsuario, Rol, Usuario, UsuarioActualizacionRequest } from '../../types/api'
import { formatDate } from '../../utils/format'
import { cn } from '@/lib/utils'

interface FormularioUsuario {
  nombre: string
  apellido: string
  rut: string
  correo: string
  telefono: string
  rol: Rol
}

const selectClase =
  'flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-brand-light focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70'

export function AdminUsuariosPage() {
  const { usuario: usuarioActual, actualizarUsuario } = useAuth()
  const { mostrar } = useNotification()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<unknown>(null)

  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null)
  const [formulario, setFormulario] = useState<FormularioUsuario>({
    nombre: '',
    apellido: '',
    rut: '',
    correo: '',
    telefono: '',
    rol: 'cliente',
  })
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [errorModal, setErrorModal] = useState<unknown>(null)
  const [guardando, setGuardando] = useState(false)

  const [usuarioEstado, setUsuarioEstado] = useState<Usuario | null>(null)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const lista = await usuarioService.listar(q || undefined)
      setUsuarios(lista)
    } catch (err: unknown) {
      setError(err)
    } finally {
      setCargando(false)
    }
  }, [q])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const abrirEditar = (usuario: Usuario) => {
    setUsuarioEditando(usuario)
    setFormulario({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rut: usuario.rut,
      correo: usuario.correo,
      telefono: usuario.telefono ?? '',
      rol: usuario.rol,
    })
    setErrores({})
    setErrorModal(null)
  }

  const actualizar = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
  }

  const guardar = async (event: FormEvent) => {
    event.preventDefault()
    if (!usuarioEditando) return
    setErrorModal(null)
    const nuevos: Record<string, string> = {}
    if (!formulario.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio'
    if (!formulario.apellido.trim()) nuevos.apellido = 'El apellido es obligatorio'
    if (!/^\d{1,2}\.?\d{3}\.?\d{3}-[\dKk]$/.test(formulario.rut.trim())) {
      nuevos.rut = 'Usa el formato 12.345.678-9'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo.trim())) {
      nuevos.correo = 'Ingresa un correo válido'
    }
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    const datos: UsuarioActualizacionRequest = {
      nombre: formulario.nombre.trim(),
      apellido: formulario.apellido.trim(),
      rut: formulario.rut.trim(),
      correo: formulario.correo.trim(),
      telefono: formulario.telefono.trim() || undefined,
      rol: formulario.rol,
    }

    setGuardando(true)
    try {
      const actualizado = await usuarioService.actualizar(usuarioEditando.id, datos)
      if (usuarioActual?.id === actualizado.id) actualizarUsuario(actualizado)
      mostrar('Usuario actualizado', 'success')
      setUsuarioEditando(null)
      await cargar()
    } catch (err: unknown) {
      setErrorModal(err)
    } finally {
      setGuardando(false)
    }
  }

  const cambiarEstado = async () => {
    if (!usuarioEstado) return
    setCambiandoEstado(true)
    try {
      const nuevoEstado: EstadoUsuario = usuarioEstado.estado === 'Activo' ? 'Inactivo' : 'Activo'
      await usuarioService.cambiarEstado(usuarioEstado.id, nuevoEstado)
      mostrar(`Usuario ${nuevoEstado === 'Activo' ? 'activado' : 'desactivado'}`, 'success')
      setUsuarioEstado(null)
      await cargar()
    } catch (err: unknown) {
      mostrar(mensajeDeError(err), 'danger')
    } finally {
      setCambiandoEstado(false)
    }
  }

  const esPropiaCuenta = usuarioActual?.id === usuarioEditando?.id

  return (
    <>
      <section className="pt-10 pb-6">
        <div className="container-page text-center">
          <h1 className="section-title">Usuarios</h1>
          <p className="page-intro mb-0">
            Administra las cuentas, sus datos de contacto, roles y estado de acceso.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page">
          <Card className="gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Users className="size-5 text-brand" aria-hidden="true" />
              <h2 className="text-lg font-bold">Cuentas registradas</h2>
            </div>

            <form
              className="grid gap-3 md:grid-cols-[1.6fr_auto]"
              onSubmit={(event) => {
                event.preventDefault()
                setQ(qInput)
              }}
            >
              <div>
                <Label htmlFor="buscar-usuario">Buscar usuario</Label>
                <Input
                  id="buscar-usuario"
                  type="search"
                  placeholder="Nombre, correo o RUT"
                  value={qInput}
                  onChange={(event) => setQInput(event.target.value)}
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
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </form>

            {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}

            {cargando ? (
              <Loading texto="Cargando usuarios..." />
            ) : usuarios.length === 0 ? (
              <EmptyState
                titulo="No hay usuarios que coincidan"
                descripcion="Prueba con otro término de búsqueda."
              />
            ) : (
              <div className="table-wrap">
                <Table className="min-w-[960px]">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Usuario</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>RUT</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usuarios.map((usuario) => {
                      const iniciales = `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase()
                      const propia = usuario.id === usuarioActual?.id
                      return (
                        <TableRow key={usuario.id} className={cn(propia && 'bg-brand/5')}>
                          <TableCell className="whitespace-normal">
                            <div className="flex items-center gap-3">
                              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 font-display text-sm font-bold text-brand">
                                {iniciales}
                              </span>
                              <div>
                                <span className="block font-bold">
                                  {usuario.nombre} {usuario.apellido}
                                </span>
                                {propia && (
                                  <Badge variant="warning" className="mt-1">
                                    Tu cuenta
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{usuario.correo}</TableCell>
                          <TableCell className="text-xs">{usuario.rut}</TableCell>
                          <TableCell>
                            <Badge
                              variant={usuario.rol === 'administrador' ? 'default' : 'outline'}
                            >
                              {usuario.rol === 'administrador' ? 'Administrador' : 'Cliente'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <UsuarioBadge estado={usuario.estado} />
                          </TableCell>
                          <TableCell className="text-xs">{formatDate(usuario.fechaRegistro)}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => abrirEditar(usuario)}
                              >
                                Editar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={usuario.estado === 'Activo' ? 'destructive' : 'default'}
                                onClick={() => setUsuarioEstado(usuario)}
                                disabled={propia}
                                title={
                                  propia
                                    ? 'No puedes cambiar el estado de tu propia cuenta'
                                    : undefined
                                }
                              >
                                {usuario.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </div>
      </section>

      <Dialog open={Boolean(usuarioEditando)} onOpenChange={(abierto) => {
        if (!abierto) setUsuarioEditando(null)
      }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Actualiza los datos de contacto y el rol de la cuenta.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={guardar}>
            {Boolean(errorModal) && (
              <ErrorAlert error={errorModal} onClose={() => setErrorModal(null)} />
            )}

            {esPropiaCuenta && (
              <Alert variant="brand">
                <ShieldCheck className="text-brand" aria-hidden="true" />
                <AlertDescription>
                  Estás editando tu propia cuenta. Por seguridad, el correo y el rol no se pueden
                  cambiar desde este panel.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="nombre-usuario">Nombre *</Label>
                <Input
                  id="nombre-usuario"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={actualizar}
                  maxLength={80}
                  aria-invalid={Boolean(errores.nombre)}
                  required
                />
                {errores.nombre && <p className="field-error">{errores.nombre}</p>}
              </div>
              <div>
                <Label htmlFor="apellido-usuario">Apellido *</Label>
                <Input
                  id="apellido-usuario"
                  name="apellido"
                  value={formulario.apellido}
                  onChange={actualizar}
                  maxLength={80}
                  aria-invalid={Boolean(errores.apellido)}
                  required
                />
                {errores.apellido && <p className="field-error">{errores.apellido}</p>}
              </div>
              <div>
                <Label htmlFor="rut-usuario">RUT *</Label>
                <Input
                  id="rut-usuario"
                  name="rut"
                  value={formulario.rut}
                  onChange={actualizar}
                  maxLength={20}
                  aria-invalid={Boolean(errores.rut)}
                  required
                />
                {errores.rut && <p className="field-error">{errores.rut}</p>}
              </div>
              <div>
                <Label htmlFor="telefono-usuario">Teléfono</Label>
                <Input
                  id="telefono-usuario"
                  name="telefono"
                  type="tel"
                  value={formulario.telefono}
                  onChange={actualizar}
                  maxLength={25}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="correo-usuario">Correo electrónico *</Label>
                <Input
                  id="correo-usuario"
                  name="correo"
                  type="email"
                  value={formulario.correo}
                  onChange={actualizar}
                  maxLength={150}
                  aria-invalid={Boolean(errores.correo)}
                  required
                  disabled={esPropiaCuenta}
                />
                {errores.correo && <p className="field-error">{errores.correo}</p>}
              </div>
              <div>
                <Label htmlFor="rol-usuario">Rol</Label>
                <select
                  id="rol-usuario"
                  name="rol"
                  className={selectClase}
                  value={formulario.rol}
                  onChange={actualizar}
                  disabled={esPropiaCuenta}
                >
                  <option value="cliente">Cliente</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUsuarioEditando(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        abierto={Boolean(usuarioEstado)}
        titulo={usuarioEstado?.estado === 'Activo' ? 'Desactivar usuario' : 'Activar usuario'}
        textoConfirmar={usuarioEstado?.estado === 'Activo' ? 'Desactivar' : 'Activar'}
        variante={usuarioEstado?.estado === 'Activo' ? 'danger' : 'success'}
        ocupado={cambiandoEstado}
        onConfirmar={cambiarEstado}
        onCancelar={() => setUsuarioEstado(null)}
      >
        <p className="mb-0">
          {usuarioEstado?.estado === 'Activo'
            ? 'El usuario no podrá iniciar sesión mientras la cuenta esté inactiva.'
            : 'El usuario podrá volver a iniciar sesión.'}
        </p>
      </ConfirmModal>
    </>
  )
}
