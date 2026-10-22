import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorAlert, mensajeDeError } from '../components/common/ErrorAlert'
import { Loading } from '../components/common/Loading'
import { PedidoBadge, UsuarioBadge } from '../components/common/StatusBadge'
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
      <section className="py-5">
        <div className="container">
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

  return (
    <>
      <section className="py-5">
        <div className="container">
          <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
            <span className="avatar-usuario fs-4" aria-hidden="true">
              {iniciales}
            </span>
            <div>
              <h1 className="h2 mb-0">
                {usuario.nombre} {usuario.apellido}
              </h1>
              <p className="texto-gris mb-0">{usuario.correo}</p>
            </div>
            <div className="ms-sm-auto d-flex flex-wrap gap-2">
              <UsuarioBadge estado={usuario.estado} />
              <span className="badge rounded-pill text-bg-light border">
                {usuario.rol === 'administrador' ? 'Administrador' : 'Cliente'}
              </span>
            </div>
          </div>

          <ul className="nav nav-pills flex-wrap gap-2 mb-4" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                type="button"
                className={`nav-link rounded-pill ${tab === 'perfil' ? 'active bg-marca' : 'text-marca'}`}
                onClick={() => setTab('perfil')}
                role="tab"
                aria-selected={tab === 'perfil'}
              >
                <i className="bi bi-person me-1" aria-hidden="true" />
                Datos personales
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                type="button"
                className={`nav-link rounded-pill ${
                  tab === 'direcciones' ? 'active bg-marca' : 'text-marca'
                }`}
                onClick={() => setTab('direcciones')}
                role="tab"
                aria-selected={tab === 'direcciones'}
              >
                <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                Direcciones
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                type="button"
                className={`nav-link rounded-pill ${tab === 'pedidos' ? 'active bg-marca' : 'text-marca'}`}
                onClick={() => setTab('pedidos')}
                role="tab"
                aria-selected={tab === 'pedidos'}
              >
                <i className="bi bi-bag-check me-1" aria-hidden="true" />
                Mis pedidos
              </button>
            </li>
          </ul>

          {tab === 'perfil' && (
            <div className="row g-4">
              <div className="col-lg-8">
                <form className="card card-formulario p-4" onSubmit={guardarPerfil}>
                  <h2 className="h5 fw-bold mb-3">Datos personales</h2>
                  {Boolean(errorPerfil) && (
                    <ErrorAlert error={errorPerfil} onClose={() => setErrorPerfil(null)} />
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="nombre" className="form-label">
                        Nombre *
                      </label>
                      <input
                        id="nombre"
                        name="nombre"
                        className="form-control"
                        value={perfil.nombre}
                        onChange={actualizarPerfil}
                        maxLength={80}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="apellido" className="form-label">
                        Apellido *
                      </label>
                      <input
                        id="apellido"
                        name="apellido"
                        className="form-control"
                        value={perfil.apellido}
                        onChange={actualizarPerfil}
                        maxLength={80}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="rut-perfil" className="form-label">
                        RUT *
                      </label>
                      <input
                        id="rut-perfil"
                        name="rut"
                        className="form-control"
                        value={perfil.rut}
                        onChange={actualizarPerfil}
                        maxLength={20}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="telefono-perfil" className="form-label">
                        Teléfono
                      </label>
                      <input
                        id="telefono-perfil"
                        name="telefono"
                        type="tel"
                        className="form-control"
                        value={perfil.telefono ?? ''}
                        onChange={actualizarPerfil}
                        maxLength={25}
                      />
                    </div>
                    <div className="col-12">
                      <label htmlFor="correo-perfil" className="form-label">
                        Correo electrónico *
                      </label>
                      <input
                        id="correo-perfil"
                        name="correo"
                        type="email"
                        className="form-control"
                        value={perfil.correo}
                        onChange={actualizarPerfil}
                        maxLength={150}
                        required
                      />
                      <div className="form-text">
                        Si cambias el correo deberás iniciar sesión nuevamente.
                      </div>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-marca rounded-pill px-4 mt-4 align-self-start"
                    disabled={guardandoPerfil}
                  >
                    {guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </form>
              </div>
              <div className="col-lg-4">
                <div className="card card-formulario p-4">
                  <h2 className="h6 fw-bold">Información de la cuenta</h2>
                  <dl className="row small mb-0">
                    <dt className="col-5 texto-gris">Registro</dt>
                    <dd className="col-7">{formatDate(usuario.fechaRegistro)}</dd>
                    <dt className="col-5 texto-gris">Rol</dt>
                    <dd className="col-7">
                      {usuario.rol === 'administrador' ? 'Administrador' : 'Cliente'}
                    </dd>
                    <dt className="col-5 texto-gris">Estado</dt>
                    <dd className="col-7">{usuario.estado}</dd>
                    <dt className="col-5 texto-gris">Correo</dt>
                    <dd className="col-7">
                      {usuario.correoConfirmado ? 'Confirmado' : 'Pendiente de confirmación'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {tab === 'direcciones' && (
            <div>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 className="h5 fw-bold mb-0">Mis direcciones</h2>
                <button type="button" className="btn btn-acento rounded-pill px-4" onClick={abrirNuevaDireccion}>
                  <i className="bi bi-plus-circle me-1" aria-hidden="true" />
                  Agregar dirección
                </button>
              </div>
              {Boolean(errorRegiones) && <ErrorAlert error={errorRegiones} />}
              {usuario.direcciones.length === 0 ? (
                <EmptyState
                  titulo="Aún no tienes direcciones"
                  descripcion="Agrega una dirección para agilizar tus próximas compras."
                  accion={
                    <button type="button" className="btn btn-marca rounded-pill" onClick={abrirNuevaDireccion}>
                      Agregar mi primera dirección
                    </button>
                  }
                />
              ) : (
                <div className="row g-4">
                  {usuario.direcciones.map((direccion) => (
                    <div className="col-md-6 col-xl-4" key={direccion.id}>
                      <article className="card card-formulario p-4 h-100">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h3 className="h6 fw-bold mb-0">
                            <i className="bi bi-geo-alt me-1 texto-marca" aria-hidden="true" />
                            {direccion.calle} {direccion.numero}
                          </h3>
                          {direccion.principal && (
                            <span className="badge text-bg-success rounded-pill">Principal</span>
                          )}
                        </div>
                        <p className="small texto-gris mb-1">
                          {direccion.comuna}, {direccion.region}
                        </p>
                        {direccion.departamento && (
                          <p className="small texto-gris mb-1">Depto. {direccion.departamento}</p>
                        )}
                        {direccion.referencia && (
                          <p className="small texto-gris mb-2">{direccion.referencia}</p>
                        )}
                        <div className="d-flex flex-wrap gap-2 mt-auto pt-3">
                          <button
                            type="button"
                            className="btn btn-sm btn-marca-outline rounded-pill"
                            onClick={() => abrirEditarDireccion(direccion)}
                          >
                            Editar
                          </button>
                          {!direccion.principal && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary rounded-pill"
                              onClick={() => marcarPrincipal(direccion)}
                            >
                              Hacer principal
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill"
                            onClick={() => setDireccionAEliminar(direccion)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </article>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'pedidos' && (
            <div>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <h2 className="h5 fw-bold mb-0">Mis pedidos</h2>
                <Link to="/productos" className="btn btn-marca-outline rounded-pill">
                  Seguir comprando
                </Link>
              </div>
              {Boolean(errorPedidos) && <ErrorAlert error={errorPedidos} />}
              {cargandoPedidos ? (
                <Loading texto="Cargando tus pedidos..." />
              ) : pedidos.length === 0 ? (
                <EmptyState
                  titulo="Todavía no tienes pedidos"
                  descripcion="Cuando realices tu primera compra aparecerá aquí."
                  accion={
                    <Link to="/productos" className="btn btn-marca rounded-pill">
                      Ver productos
                    </Link>
                  }
                />
              ) : (
                <div className="card card-formulario p-3 p-md-4">
                  <div className="table-responsive">
                    <table className="table table-hover align-middle tabla-marca mb-0">
                      <thead>
                        <tr>
                          <th scope="col">Orden</th>
                          <th scope="col">Fecha</th>
                          <th scope="col">Productos</th>
                          <th scope="col">Total</th>
                          <th scope="col">Estado</th>
                          <th scope="col" className="text-end">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pedidos.map((pedido) => (
                          <tr key={pedido.id}>
                            <td className="fw-bold">{pedido.numeroOrden}</td>
                            <td>{formatDateTime(pedido.fechaCreacion)}</td>
                            <td>{pedido.cantidadProductos}</td>
                            <td>{formatCLP(pedido.total)}</td>
                            <td>
                              <PedidoBadge estado={pedido.estado} />
                              <span className="d-block small texto-gris mt-1">
                                Pago: {pedido.estadoPago}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="d-flex flex-wrap justify-content-end gap-2">
                                <Link
                                  to={`/pedido/${pedido.id}`}
                                  className="btn btn-sm btn-marca-outline rounded-pill"
                                >
                                  Ver detalle
                                </Link>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-marca rounded-pill"
                                  onClick={() => descargarComprobante(pedido)}
                                  disabled={descargandoId === pedido.id}
                                >
                                  {descargandoId === pedido.id ? 'Descargando...' : 'Comprobante'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {modalDireccion && (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
              <form className="modal-content" onSubmit={guardarDireccion}>
                <div className="modal-header">
                  <h2 className="modal-title h5">
                    {direccionEditando ? 'Editar dirección' : 'Nueva dirección'}
                  </h2>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Cerrar"
                    onClick={() => setModalDireccion(false)}
                  />
                </div>
                <div className="modal-body">
                  {Boolean(errorDireccion) && (
                    <ErrorAlert error={errorDireccion} onClose={() => setErrorDireccion(null)} />
                  )}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="region-direccion" className="form-label">
                        Región *
                      </label>
                      <select
                        id="region-direccion"
                        name="region"
                        className={`form-select${erroresDireccion.region ? ' is-invalid' : ''}`}
                        value={formDireccion.region}
                        onChange={(event) => {
                          setFormDireccion((actual) => ({
                            ...actual,
                            region: event.target.value,
                            comuna: '',
                          }))
                        }}
                        required
                      >
                        <option value="">Selecciona una región</option>
                        {regiones.map((region) => (
                          <option key={region.codigo} value={region.nombre}>
                            {region.nombre}
                          </option>
                        ))}
                      </select>
                      {erroresDireccion.region && (
                        <div className="invalid-feedback">{erroresDireccion.region}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="comuna-direccion" className="form-label">
                        Comuna *
                      </label>
                      <select
                        id="comuna-direccion"
                        name="comuna"
                        className={`form-select${erroresDireccion.comuna ? ' is-invalid' : ''}`}
                        value={formDireccion.comuna}
                        onChange={actualizarDireccion}
                        disabled={!regionSeleccionada}
                        required
                      >
                        <option value="">Selecciona una comuna</option>
                        {regionSeleccionada?.comunas.map((comuna) => (
                          <option key={comuna.id} value={comuna.nombre}>
                            {comuna.nombre}
                          </option>
                        ))}
                      </select>
                      {erroresDireccion.comuna && (
                        <div className="invalid-feedback">{erroresDireccion.comuna}</div>
                      )}
                    </div>
                    <div className="col-md-8">
                      <label htmlFor="calle" className="form-label">
                        Calle *
                      </label>
                      <input
                        id="calle"
                        name="calle"
                        className={`form-control${erroresDireccion.calle ? ' is-invalid' : ''}`}
                        value={formDireccion.calle}
                        onChange={actualizarDireccion}
                        maxLength={150}
                        required
                      />
                      {erroresDireccion.calle && (
                        <div className="invalid-feedback">{erroresDireccion.calle}</div>
                      )}
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="numero" className="form-label">
                        Número *
                      </label>
                      <input
                        id="numero"
                        name="numero"
                        className={`form-control${erroresDireccion.numero ? ' is-invalid' : ''}`}
                        value={formDireccion.numero}
                        onChange={actualizarDireccion}
                        maxLength={20}
                        required
                      />
                      {erroresDireccion.numero && (
                        <div className="invalid-feedback">{erroresDireccion.numero}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="departamento" className="form-label">
                        Departamento / casa
                      </label>
                      <input
                        id="departamento"
                        name="departamento"
                        className="form-control"
                        value={formDireccion.departamento ?? ''}
                        onChange={actualizarDireccion}
                        maxLength={50}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="referencia" className="form-label">
                        Referencia
                      </label>
                      <input
                        id="referencia"
                        name="referencia"
                        className="form-control"
                        value={formDireccion.referencia ?? ''}
                        onChange={actualizarDireccion}
                        maxLength={250}
                      />
                    </div>
                  </div>
                  <div className="form-check mt-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="principal"
                      name="principal"
                      checked={formDireccion.principal}
                      onChange={actualizarDireccion}
                    />
                    <label className="form-check-label" htmlFor="principal">
                      Usar como dirección principal
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary rounded-pill"
                    onClick={() => setModalDireccion(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-marca rounded-pill"
                    disabled={guardandoDireccion}
                  >
                    {guardandoDireccion ? 'Guardando...' : 'Guardar dirección'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}

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
