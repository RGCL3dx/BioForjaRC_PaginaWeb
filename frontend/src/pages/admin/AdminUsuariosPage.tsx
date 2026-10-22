import { useCallback, useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorAlert, mensajeDeError } from '../../components/common/ErrorAlert'
import { Loading } from '../../components/common/Loading'
import { UsuarioBadge } from '../../components/common/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { usuarioService } from '../../services/usuarios'
import type { EstadoUsuario, Rol, Usuario, UsuarioActualizacionRequest } from '../../types/api'
import { formatDate } from '../../utils/format'

interface FormularioUsuario {
  nombre: string
  apellido: string
  rut: string
  correo: string
  telefono: string
  rol: Rol
}

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

  const campoClase = (campo: string) => `form-control${errores[campo] ? ' is-invalid' : ''}`
  const esPropiaCuenta = usuarioActual?.id === usuarioEditando?.id

  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="titulo-seccion">Usuarios</h1>
          <p className="pagina-intro">
            Administra las cuentas, sus datos de contacto, roles y estado de acceso.
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
              }}
            >
              <div className="col-md-8">
                <label htmlFor="buscar-usuario" className="form-label">
                  Buscar usuario
                </label>
                <input
                  id="buscar-usuario"
                  type="search"
                  className="form-control"
                  placeholder="Nombre, correo o RUT"
                  value={qInput}
                  onChange={(event) => setQInput(event.target.value)}
                />
              </div>
              <div className="col-md-4 d-flex gap-2">
                <button type="submit" className="btn btn-marca rounded-pill flex-grow-1">
                  Buscar
                </button>
                <button
                  type="button"
                  className="btn btn-marca-outline rounded-pill"
                  onClick={() => {
                    setQInput('')
                    setQ('')
                  }}
                >
                  Limpiar
                </button>
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
              <div className="table-responsive">
                <table className="table table-hover align-middle tabla-marca tabla-admin mb-0">
                  <thead>
                    <tr>
                      <th scope="col">Usuario</th>
                      <th scope="col">Correo</th>
                      <th scope="col">RUT</th>
                      <th scope="col">Rol</th>
                      <th scope="col">Estado</th>
                      <th scope="col">Registro</th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((usuario) => {
                      const iniciales = `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase()
                      const propia = usuario.id === usuarioActual?.id
                      return (
                        <tr key={usuario.id} className={propia ? 'fila-actual' : undefined}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className="avatar-usuario">{iniciales}</span>
                              <div>
                                <span className="fw-bold d-block">
                                  {usuario.nombre} {usuario.apellido}
                                </span>
                                {propia && <span className="badge text-bg-warning">Tu cuenta</span>}
                              </div>
                            </div>
                          </td>
                          <td className="small">{usuario.correo}</td>
                          <td className="small">{usuario.rut}</td>
                          <td>
                            <span
                              className={`badge rounded-pill ${
                                usuario.rol === 'administrador' ? 'text-bg-dark' : 'text-bg-light border'
                              }`}
                            >
                              {usuario.rol === 'administrador' ? 'Administrador' : 'Cliente'}
                            </span>
                          </td>
                          <td>
                            <UsuarioBadge estado={usuario.estado} />
                          </td>
                          <td className="small">{formatDate(usuario.fechaRegistro)}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-marca-outline rounded-pill"
                                onClick={() => abrirEditar(usuario)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className={`btn btn-sm rounded-pill ${
                                  usuario.estado === 'Activo' ? 'btn-outline-danger' : 'btn-marca'
                                }`}
                                onClick={() => setUsuarioEstado(usuario)}
                                disabled={propia}
                                title={propia ? 'No puedes cambiar el estado de tu propia cuenta' : undefined}
                              >
                                {usuario.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {usuarioEditando && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <form className="modal-content" onSubmit={guardar}>
                <div className="modal-header">
                  <h2 className="modal-title h5">Editar usuario</h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Cerrar"
                    onClick={() => setUsuarioEditando(null)}
                  />
                </div>
                <div className="modal-body">
                  {Boolean(errorModal) && (
                    <ErrorAlert error={errorModal} onClose={() => setErrorModal(null)} />
                  )}
                  {esPropiaCuenta && (
                    <div className="aviso-sesion mb-3">
                      Estás editando tu propia cuenta. Por seguridad, el correo y el rol no se pueden
                      cambiar desde este panel.
                    </div>
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="nombre-usuario" className="form-label">
                        Nombre *
                      </label>
                      <input
                        id="nombre-usuario"
                        name="nombre"
                        className={campoClase('nombre')}
                        value={formulario.nombre}
                        onChange={actualizar}
                        maxLength={80}
                        required
                      />
                      {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="apellido-usuario" className="form-label">
                        Apellido *
                      </label>
                      <input
                        id="apellido-usuario"
                        name="apellido"
                        className={campoClase('apellido')}
                        value={formulario.apellido}
                        onChange={actualizar}
                        maxLength={80}
                        required
                      />
                      {errores.apellido && <div className="invalid-feedback">{errores.apellido}</div>}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="rut-usuario" className="form-label">
                        RUT *
                      </label>
                      <input
                        id="rut-usuario"
                        name="rut"
                        className={campoClase('rut')}
                        value={formulario.rut}
                        onChange={actualizar}
                        maxLength={20}
                        required
                      />
                      {errores.rut && <div className="invalid-feedback">{errores.rut}</div>}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="telefono-usuario" className="form-label">
                        Teléfono
                      </label>
                      <input
                        id="telefono-usuario"
                        name="telefono"
                        type="tel"
                        className="form-control"
                        value={formulario.telefono}
                        onChange={actualizar}
                        maxLength={25}
                      />
                    </div>
                    <div className="col-md-8">
                      <label htmlFor="correo-usuario" className="form-label">
                        Correo electrónico *
                      </label>
                      <input
                        id="correo-usuario"
                        name="correo"
                        type="email"
                        className={campoClase('correo')}
                        value={formulario.correo}
                        onChange={actualizar}
                        maxLength={150}
                        required
                        disabled={esPropiaCuenta}
                      />
                      {errores.correo && <div className="invalid-feedback">{errores.correo}</div>}
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="rol-usuario" className="form-label">
                        Rol
                      </label>
                      <select
                        id="rol-usuario"
                        name="rol"
                        className="form-select"
                        value={formulario.rol}
                        onChange={actualizar}
                        disabled={esPropiaCuenta}
                      >
                        <option value="cliente">Cliente</option>
                        <option value="administrador">Administrador</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill"
                    onClick={() => setUsuarioEditando(null)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-marca rounded-pill" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

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
