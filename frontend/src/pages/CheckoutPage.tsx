import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { Loading } from '../components/common/Loading'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useNotification } from '../context/NotificationContext'
import { catalogoService } from '../services/catalogo'
import { envioService } from '../services/envios'
import { pedidoService } from '../services/pedidos'
import type {
  MetodoDespacho,
  MetodoPago,
  OpcionesEnvio,
  Region,
  TipoDocumento,
} from '../types/api'
import { assetUrl, formatCLP } from '../utils/format'

interface FormularioCheckout {
  nombre: string
  apellido: string
  telefono: string
  rut: string
  documentoTipo: TipoDocumento
  rutFacturacion: string
  razonSocial: string
  giro: string
  regionCodigo: string
  comuna: string
  direccion: string
  metodoDespacho: string
  metodoPago: MetodoPago
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function CheckoutPage() {
  const { usuario } = useAuth()
  const { items, subtotal, actualizarProducto, vaciar } = useCart()
  const { mostrar } = useNotification()
  const navigate = useNavigate()

  const [regiones, setRegiones] = useState<Region[]>([])
  const [metodos, setMetodos] = useState<MetodoDespacho[]>([])
  const [opciones, setOpciones] = useState<OpcionesEnvio | null>(null)
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true)
  const [cargandoOpciones, setCargandoOpciones] = useState(false)
  const [verificandoStock, setVerificandoStock] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [errorOpciones, setErrorOpciones] = useState<unknown>(null)

  const [formulario, setFormulario] = useState<FormularioCheckout>({
    nombre: usuario?.nombre ?? '',
    apellido: usuario?.apellido ?? '',
    telefono: usuario?.telefono ?? '',
    rut: usuario?.rut ?? '',
    documentoTipo: 'boleta',
    rutFacturacion: '',
    razonSocial: '',
    giro: '',
    regionCodigo: '',
    comuna: '',
    direccion: '',
    metodoDespacho: 'estandar',
    metodoPago: 'tarjeta',
  })

  useEffect(() => {
    if (!usuario) return
    setFormulario((actual) => ({
      ...actual,
      nombre: actual.nombre || usuario.nombre,
      apellido: actual.apellido || usuario.apellido,
      telefono: actual.telefono || usuario.telefono || '',
      rut: actual.rut || usuario.rut,
    }))
  }, [usuario])

  useEffect(() => {
    let activo = true
    Promise.all([envioService.listarRegiones(), envioService.listarMetodos()])
      .then(([listaRegiones, listaMetodos]) => {
        if (!activo) return
        setRegiones(listaRegiones)
        setMetodos(listaMetodos)

        const principal = usuario?.direcciones?.find((direccion) => direccion.principal)
        if (principal) {
          const region = listaRegiones.find(
            (item) =>
              normalizar(item.nombre) === normalizar(principal.region) ||
              normalizar(item.codigo) === normalizar(principal.region),
          )
          const comuna = region?.comunas.find(
            (item) =>
              normalizar(item.nombre) === normalizar(principal.comuna) ||
              normalizar(item.slug) === normalizar(principal.comuna),
          )
          setFormulario((actual) => ({
            ...actual,
            regionCodigo: region?.codigo ?? actual.regionCodigo,
            comuna: comuna?.nombre ?? principal.comuna,
            direccion: `${principal.calle} ${principal.numero}${
              principal.departamento ? `, ${principal.departamento}` : ''
            }`,
          }))
        }
      })
      .catch((err: unknown) => {
        if (activo) setError(err)
      })
      .finally(() => {
        if (activo) setCargandoCatalogos(false)
      })
    return () => {
      activo = false
    }
  }, [usuario])

  useEffect(() => {
    if (items.length === 0) {
      setVerificandoStock(false)
      return
    }
    let activo = true
    Promise.allSettled(
      items.map((item) => catalogoService.obtenerProducto(item.producto.id)),
    )
      .then((resultados) => {
        if (!activo) return
        resultados.forEach((resultado) => {
          if (resultado.status === 'fulfilled') {
            const detalle = resultado.value
            actualizarProducto({
              id: detalle.id,
              nombre: detalle.nombre,
              descripcion: detalle.descripcion,
              precio: detalle.precio,
              stock: detalle.stock,
              stockBajo: detalle.stockBajo,
              categoria: detalle.categoria,
              imagen: detalle.imagen,
              activo: detalle.activo,
            })
          }
        })
      })
      .finally(() => {
        if (activo) setVerificandoStock(false)
      })
    return () => {
      activo = false
    }
    // Se ejecuta una sola vez al entrar al checkout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!formulario.regionCodigo) {
      setOpciones(null)
      setErrorOpciones(null)
      return
    }
    let activo = true
    setCargandoOpciones(true)
    setErrorOpciones(null)
    envioService
      .opciones({
        regionCodigo: formulario.regionCodigo,
        comuna: formulario.comuna || undefined,
        subtotal,
      })
      .then((respuesta) => {
        if (!activo) return
        setOpciones(respuesta)
        setFormulario((actual) => {
          const disponibles = respuesta.opciones.map((opcion) => opcion.metodoCodigo)
          if (disponibles.includes(actual.metodoDespacho)) return actual
          return { ...actual, metodoDespacho: disponibles[0] ?? actual.metodoDespacho }
        })
      })
      .catch((err: unknown) => {
        if (activo) {
          setErrorOpciones(err)
          setOpciones(null)
        }
      })
      .finally(() => {
        if (activo) setCargandoOpciones(false)
      })
    return () => {
      activo = false
    }
  }, [formulario.regionCodigo, formulario.comuna, subtotal])

  const regionSeleccionada = regiones.find((region) => region.codigo === formulario.regionCodigo)
  const opcionSeleccionada = opciones?.opciones.find(
    (opcion) => opcion.metodoCodigo === formulario.metodoDespacho,
  )
  const metodoSeleccionado = metodos.find(
    (metodo) => metodo.codigo === formulario.metodoDespacho,
  )
  const requiereDireccion =
    opcionSeleccionada?.requiereDireccion ??
    metodoSeleccionado?.requiereDireccion ??
    formulario.metodoDespacho !== 'retiro'
  const costoEnvio =
    opcionSeleccionada?.costoEnvio ?? (formulario.metodoDespacho === 'retiro' ? 0 : 0)
  const total = subtotal + Number(costoEnvio)
  const hayProblemaStock = items.some(
    (item) => item.producto.stock <= 0 || item.cantidad > item.producto.stock,
  )

  const actualizarCampo = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
  }

  const seleccionarMetodo = (codigo: string) => {
    const opcion = opciones?.opciones.find((item) => item.metodoCodigo === codigo)
    const metodo = metodos.find((item) => item.codigo === codigo)
    if (!opcion && !metodo) return
    if (!opciones && codigo !== 'retiro') {
      mostrar('Selecciona una región para calcular el costo de este método', 'warning')
      return
    }
    setFormulario((actual) => ({ ...actual, metodoDespacho: codigo }))
  }

  const enviarPedido = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (items.length === 0) {
      setError(new Error('Tu carrito está vacío. Agrega productos antes de pagar.'))
      return
    }
    if (hayProblemaStock) {
      setError(new Error('Hay productos sin stock suficiente. Revisa tu carrito antes de continuar.'))
      return
    }
    if (requiereDireccion) {
      if (!formulario.regionCodigo || !formulario.comuna || !formulario.direccion.trim()) {
        setError(new Error('Completa la región, comuna y dirección de despacho.'))
        return
      }
      if (!opciones) {
        setError(new Error('No se pudo calcular el costo de envío. Intenta nuevamente.'))
        return
      }
    }
    if (formulario.documentoTipo === 'factura') {
      if (!formulario.rutFacturacion.trim() || !formulario.razonSocial.trim() || !formulario.giro.trim()) {
        setError(new Error('Para emitir factura debes completar RUT, razón social y giro.'))
        return
      }
    }

    setEnviando(true)
    try {
      const pedido = await pedidoService.crear({
        nombre: formulario.nombre,
        apellido: formulario.apellido,
        telefono: formulario.telefono || undefined,
        rut: formulario.rut || undefined,
        documentoTipo: formulario.documentoTipo,
        rutFacturacion:
          formulario.documentoTipo === 'factura' ? formulario.rutFacturacion : undefined,
        razonSocial:
          formulario.documentoTipo === 'factura' ? formulario.razonSocial : undefined,
        giro: formulario.documentoTipo === 'factura' ? formulario.giro : undefined,
        direccion: requiereDireccion ? formulario.direccion : undefined,
        comuna: requiereDireccion ? formulario.comuna : undefined,
        regionCodigo: requiereDireccion ? formulario.regionCodigo : undefined,
        metodoDespacho: formulario.metodoDespacho,
        metodoPago: formulario.metodoPago,
        items: items.map((item) => ({ productoId: item.producto.id, cantidad: item.cantidad })),
      })
      vaciar()
      mostrar('Pedido creado correctamente', 'success')
      navigate(`/pedido/${pedido.id}`, { state: { nuevo: true } })
    } catch (err: unknown) {
      setError(err)
    } finally {
      setEnviando(false)
    }
  }

  if (cargandoCatalogos || verificandoStock) {
    return (
      <section className="py-5">
        <div className="container">
          <Loading texto="Preparando tu checkout..." />
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="py-5">
        <div className="container text-center">
          <h1 className="titulo-seccion">Finalizar compra</h1>
          <p className="pagina-intro">Tu carrito está vacío.</p>
          <Link to="/productos" className="btn btn-marca btn-lg rounded-pill px-4">
            Ver productos
          </Link>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="titulo-seccion">Finalizar compra</h1>
          <p className="pagina-intro">
            Completa tus datos para generar la orden y el comprobante de compra.
          </p>
        </div>
      </section>

      <section className="py-4">
        <div className="container">
          <form className="row g-4" onSubmit={enviarPedido} noValidate>
            <div className="col-lg-8">
              {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}
              {hayProblemaStock && (
                <div className="alert alert-warning">
                  Uno o más productos no tienen stock suficiente. Vuelve al{' '}
                  <Link to="/carrito" className="alert-link">
                    carrito
                  </Link>{' '}
                  para ajustar las cantidades.
                </div>
              )}

              <div className="card card-formulario p-4 mb-4">
                <h2 className="h5 fw-bold mb-3">
                  <i className="bi bi-person me-2 texto-marca" aria-hidden="true" />
                  Datos del comprador
                </h2>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="nombre" className="form-label">
                      Nombre *
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      className="form-control"
                      value={formulario.nombre}
                      onChange={actualizarCampo}
                      required
                      maxLength={100}
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
                      value={formulario.apellido}
                      onChange={actualizarCampo}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="correo-cuenta" className="form-label">
                      Correo de la cuenta
                    </label>
                    <input
                      id="correo-cuenta"
                      className="form-control"
                      value={usuario?.correo ?? ''}
                      readOnly
                      disabled
                    />
                    <div className="form-text">El comprobante se asociará a este correo.</div>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="telefono" className="form-label">
                      Teléfono
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      className="form-control"
                      value={formulario.telefono}
                      onChange={actualizarCampo}
                      maxLength={30}
                    />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="rut" className="form-label">
                      RUT
                    </label>
                    <input
                      id="rut"
                      name="rut"
                      className="form-control"
                      value={formulario.rut}
                      onChange={actualizarCampo}
                      maxLength={20}
                      placeholder="12.345.678-9"
                    />
                  </div>
                </div>
              </div>

              <div className="card card-formulario p-4 mb-4">
                <h2 className="h5 fw-bold mb-3">
                  <i className="bi bi-receipt me-2 texto-marca" aria-hidden="true" />
                  Documento de compra
                </h2>
                <div className="d-flex flex-wrap gap-3 mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="documentoTipo"
                      id="documento-boleta"
                      value="boleta"
                      checked={formulario.documentoTipo === 'boleta'}
                      onChange={() =>
                        setFormulario((actual) => ({ ...actual, documentoTipo: 'boleta' }))
                      }
                    />
                    <label className="form-check-label" htmlFor="documento-boleta">
                      Boleta
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="radio"
                      name="documentoTipo"
                      id="documento-factura"
                      value="factura"
                      checked={formulario.documentoTipo === 'factura'}
                      onChange={() =>
                        setFormulario((actual) => ({ ...actual, documentoTipo: 'factura' }))
                      }
                    />
                    <label className="form-check-label" htmlFor="documento-factura">
                      Factura
                    </label>
                  </div>
                </div>
                {formulario.documentoTipo === 'factura' && (
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label htmlFor="rutFacturacion" className="form-label">
                        RUT de facturación *
                      </label>
                      <input
                        id="rutFacturacion"
                        name="rutFacturacion"
                        className="form-control"
                        value={formulario.rutFacturacion}
                        onChange={actualizarCampo}
                        maxLength={20}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="razonSocial" className="form-label">
                        Razón social *
                      </label>
                      <input
                        id="razonSocial"
                        name="razonSocial"
                        className="form-control"
                        value={formulario.razonSocial}
                        onChange={actualizarCampo}
                        maxLength={150}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label htmlFor="giro" className="form-label">
                        Giro *
                      </label>
                      <input
                        id="giro"
                        name="giro"
                        className="form-control"
                        value={formulario.giro}
                        onChange={actualizarCampo}
                        maxLength={120}
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="card card-formulario p-4 mb-4">
                <h2 className="h5 fw-bold mb-3">
                  <i className="bi bi-truck me-2 texto-marca" aria-hidden="true" />
                  Despacho
                </h2>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label htmlFor="regionCodigo" className="form-label">
                      Región {requiereDireccion ? '*' : ''}
                    </label>
                    <select
                      id="regionCodigo"
                      name="regionCodigo"
                      className="form-select"
                      value={formulario.regionCodigo}
                      onChange={(event) => {
                        setFormulario((actual) => ({
                          ...actual,
                          regionCodigo: event.target.value,
                          comuna: '',
                        }))
                      }}
                      required={requiereDireccion}
                    >
                      <option value="">Selecciona una región</option>
                      {regiones.map((region) => (
                        <option key={region.codigo} value={region.codigo}>
                          {region.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="comuna" className="form-label">
                      Comuna {requiereDireccion ? '*' : ''}
                    </label>
                    <select
                      id="comuna"
                      name="comuna"
                      className="form-select"
                      value={formulario.comuna}
                      onChange={actualizarCampo}
                      required={requiereDireccion}
                      disabled={!regionSeleccionada}
                    >
                      <option value="">Selecciona una comuna</option>
                      {regionSeleccionada?.comunas.map((comuna) => (
                        <option key={comuna.id} value={comuna.nombre}>
                          {comuna.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label htmlFor="direccion" className="form-label">
                      Dirección {requiereDireccion ? '*' : ''}
                    </label>
                    <input
                      id="direccion"
                      name="direccion"
                      className="form-control"
                      value={formulario.direccion}
                      onChange={actualizarCampo}
                      maxLength={200}
                      placeholder="Calle, número, departamento o referencia"
                      required={requiereDireccion}
                      disabled={!requiereDireccion}
                    />
                  </div>
                </div>

                <h3 className="h6 fw-bold mt-4 mb-2">Método de despacho</h3>
                {cargandoOpciones && <p className="texto-gris small">Calculando costos de envío...</p>}
                {Boolean(errorOpciones) && <ErrorAlert error={errorOpciones} />}
                <div className="row g-2">
                  {metodos.map((metodo) => {
                    const opcion = opciones?.opciones.find(
                      (item) => item.metodoCodigo === metodo.codigo,
                    )
                    const disponible = Boolean(opcion) || metodo.codigo === 'retiro'
                    return (
                      <div className="col-md-4" key={metodo.codigo}>
                        <button
                          type="button"
                          className={`card h-100 w-100 text-start border-2 ${
                            formulario.metodoDespacho === metodo.codigo
                              ? 'border-success bg-success-subtle'
                              : 'border-light-subtle'
                          }`}
                          onClick={() => seleccionarMetodo(metodo.codigo)}
                          disabled={!disponible}
                          aria-pressed={formulario.metodoDespacho === metodo.codigo}
                        >
                          <span className="card-body p-3">
                            <span className="fw-bold d-block">{metodo.nombre}</span>
                            <span className="small texto-gris d-block">{metodo.descripcion}</span>
                            <span className="small fw-bold texto-marca d-block mt-2">
                              {opcion
                                ? opcion.costoEnvio === 0
                                  ? 'Sin costo'
                                  : formatCLP(opcion.costoEnvio)
                                : metodo.codigo === 'retiro'
                                  ? 'Sin costo'
                                  : 'Selecciona región'}
                            </span>
                            {opcion && (
                              <span className="small texto-gris d-block">
                                {opcion.diasHabiles} día{opcion.diasHabiles === 1 ? '' : 's'} hábil
                                {opcion.diasHabiles === 1 ? '' : 'es'}
                              </span>
                            )}
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>
                {metodos.length === 0 && (
                  <div className="alert alert-warning mb-0">No hay métodos de despacho disponibles.</div>
                )}
              </div>

              <div className="card card-formulario p-4">
                <h2 className="h5 fw-bold mb-3">
                  <i className="bi bi-credit-card me-2 texto-marca" aria-hidden="true" />
                  Pago
                </h2>
                <div className="row g-3">
                  <div className="col-md-6">
                    <button
                      type="button"
                      className={`card h-100 w-100 text-start border-2 ${
                        formulario.metodoPago === 'tarjeta'
                          ? 'border-success bg-success-subtle'
                          : 'border-light-subtle'
                      }`}
                      onClick={() => setFormulario((actual) => ({ ...actual, metodoPago: 'tarjeta' }))}
                      aria-pressed={formulario.metodoPago === 'tarjeta'}
                    >
                      <span className="card-body p-3">
                        <span className="fw-bold d-block">
                          <i className="bi bi-credit-card-2-front me-2" aria-hidden="true" />
                          Tarjeta de crédito o débito
                        </span>
                        <span className="small texto-gris">
                          Pago simulado para esta versión local.
                        </span>
                      </span>
                    </button>
                  </div>
                  <div className="col-md-6">
                    <button
                      type="button"
                      className={`card h-100 w-100 text-start border-2 ${
                        formulario.metodoPago === 'transferencia'
                          ? 'border-success bg-success-subtle'
                          : 'border-light-subtle'
                      }`}
                      onClick={() =>
                        setFormulario((actual) => ({ ...actual, metodoPago: 'transferencia' }))
                      }
                      aria-pressed={formulario.metodoPago === 'transferencia'}
                    >
                      <span className="card-body p-3">
                        <span className="fw-bold d-block">
                          <i className="bi bi-bank me-2" aria-hidden="true" />
                          Transferencia bancaria
                        </span>
                        <span className="small texto-gris">
                          Recibirás los datos por correo (registrado en log).
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
                <div className="alert alert-info mt-3 mb-0 small">
                  <i className="bi bi-info-circle me-2" aria-hidden="true" />
                  El pago es simulado: no se cobrará dinero real. El pedido quedará registrado y
                  podrás descargar tu comprobante.
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card card-formulario p-4 sticky-lg-top" style={{ top: '100px' }}>
                <h2 className="h5 fw-bold mb-3">Resumen del pedido</h2>
                <ul className="list-unstyled mb-3">
                  {items.map((item) => (
                    <li key={item.producto.id} className="d-flex gap-2 mb-3">
                      <img
                        src={assetUrl(item.producto.imagen)}
                        alt=""
                        width={52}
                        height={52}
                        className="rounded-2"
                        style={{ objectFit: 'cover' }}
                      />
                      <div className="flex-grow-1">
                        <span className="fw-bold small d-block">{item.producto.nombre}</span>
                        <span className="small texto-gris">
                          {item.cantidad} × {formatCLP(item.producto.precio)}
                        </span>
                      </div>
                      <span className="small fw-bold">
                        {formatCLP(Number(item.producto.precio) * item.cantidad)}
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="row mb-2">
                  <dt className="col-7 fw-normal texto-gris">Subtotal productos</dt>
                  <dd className="col-5 text-end mb-0">{formatCLP(subtotal)}</dd>
                  <dt className="col-7 fw-normal texto-gris">Costo de envío</dt>
                  <dd className="col-5 text-end mb-0">
                    {opcionSeleccionada
                      ? opcionSeleccionada.costoEnvio === 0
                        ? 'Sin costo'
                        : formatCLP(opcionSeleccionada.costoEnvio)
                      : formulario.metodoDespacho === 'retiro'
                        ? 'Sin costo'
                        : 'Por calcular'}
                  </dd>
                </dl>
                <hr />
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold">Total a pagar</span>
                  <span className="fs-4 fw-bold texto-marca">{formatCLP(total)}</span>
                </div>
                {regionSeleccionada && formulario.comuna && (
                  <p className="small texto-gris">
                    <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                    {formulario.comuna}, {regionSeleccionada.nombre}
                  </p>
                )}
                <button
                  type="submit"
                  className="btn btn-acento btn-lg rounded-pill w-100"
                  disabled={enviando || hayProblemaStock}
                >
                  {enviando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-lock me-1" aria-hidden="true" />
                      Pagar y generar pedido
                    </>
                  )}
                </button>
                <Link to="/carrito" className="btn btn-link w-100 mt-2 text-decoration-none">
                  Volver al carrito
                </Link>
              </div>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
