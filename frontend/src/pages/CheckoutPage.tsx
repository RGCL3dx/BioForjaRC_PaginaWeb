import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Banknote,
  CreditCard,
  Info,
  Lock,
  MapPin,
  Package,
  ReceiptText,
  Truck,
  UserRound,
} from 'lucide-react'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { Loading } from '../components/common/Loading'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Spinner } from '../components/ui/spinner'
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
import { cn } from '@/lib/utils'

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

const selectClase =
  'flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-brand-light focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70'

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
    Promise.allSettled(items.map((item) => catalogoService.obtenerProducto(item.producto.id)))
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
      if (
        !formulario.rutFacturacion.trim() ||
        !formulario.razonSocial.trim() ||
        !formulario.giro.trim()
      ) {
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
        razonSocial: formulario.documentoTipo === 'factura' ? formulario.razonSocial : undefined,
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
      <section className="py-12">
        <div className="container-page">
          <Loading texto="Preparando tu checkout..." />
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="py-16">
        <div className="container-page text-center">
          <h1 className="section-title">Finalizar compra</h1>
          <p className="page-intro">Tu carrito está vacío.</p>
          <Button asChild size="lg">
            <Link to="/productos">Ver productos</Link>
          </Button>
        </div>
      </section>
    )
  }

  const opcionClase = (activa: boolean) =>
    cn(
      'h-full w-full rounded-xl border-2 p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
      activa
        ? 'border-primary bg-brand/5'
        : 'border-border bg-white hover:border-brand-light',
    )

  return (
    <>
      <section className="pt-10 pb-6">
        <div className="container-page text-center">
          <h1 className="section-title">Finalizar compra</h1>
          <p className="page-intro mb-0">
            Completa tus datos para generar la orden y el comprobante de compra.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page">
          <form className="grid gap-5 lg:grid-cols-[1fr_22rem]" onSubmit={enviarPedido} noValidate>
            <div className="space-y-4">
              {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}
              {hayProblemaStock && (
                <Alert variant="warning">
                  <AlertDescription>
                    Uno o más productos no tienen stock suficiente. Vuelve al{' '}
                    <Link to="/carrito" className="font-semibold underline">
                      carrito
                    </Link>{' '}
                    para ajustar las cantidades.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="gap-4 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <UserRound className="size-5 text-primary" aria-hidden="true" />
                  Datos del comprador
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="nombre">Nombre *</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formulario.nombre}
                      onChange={actualizarCampo}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="apellido">Apellido *</Label>
                    <Input
                      id="apellido"
                      name="apellido"
                      value={formulario.apellido}
                      onChange={actualizarCampo}
                      required
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label htmlFor="correo-cuenta">Correo de la cuenta</Label>
                    <Input
                      id="correo-cuenta"
                      value={usuario?.correo ?? ''}
                      readOnly
                      disabled
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      El comprobante se asociará a este correo.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      value={formulario.telefono}
                      onChange={actualizarCampo}
                      maxLength={30}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rut">RUT</Label>
                    <Input
                      id="rut"
                      name="rut"
                      value={formulario.rut}
                      onChange={actualizarCampo}
                      maxLength={20}
                      placeholder="12.345.678-9"
                    />
                  </div>
                </div>
              </Card>

              <Card className="gap-4 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <ReceiptText className="size-5 text-primary" aria-hidden="true" />
                  Documento de compra
                </h2>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="documentoTipo"
                      id="documento-boleta"
                      value="boleta"
                      checked={formulario.documentoTipo === 'boleta'}
                      onChange={() =>
                        setFormulario((actual) => ({ ...actual, documentoTipo: 'boleta' }))
                      }
                      className="size-4 accent-primary"
                    />
                    Boleta
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="documentoTipo"
                      id="documento-factura"
                      value="factura"
                      checked={formulario.documentoTipo === 'factura'}
                      onChange={() =>
                        setFormulario((actual) => ({ ...actual, documentoTipo: 'factura' }))
                      }
                      className="size-4 accent-primary"
                    />
                    Factura
                  </label>
                </div>
                {formulario.documentoTipo === 'factura' && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label htmlFor="rutFacturacion">RUT de facturación *</Label>
                      <Input
                        id="rutFacturacion"
                        name="rutFacturacion"
                        value={formulario.rutFacturacion}
                        onChange={actualizarCampo}
                        maxLength={20}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="razonSocial">Razón social *</Label>
                      <Input
                        id="razonSocial"
                        name="razonSocial"
                        value={formulario.razonSocial}
                        onChange={actualizarCampo}
                        maxLength={150}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="giro">Giro *</Label>
                      <Input
                        id="giro"
                        name="giro"
                        value={formulario.giro}
                        onChange={actualizarCampo}
                        maxLength={120}
                        required
                      />
                    </div>
                  </div>
                )}
              </Card>

              <Card className="gap-4 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Truck className="size-5 text-primary" aria-hidden="true" />
                  Despacho
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="regionCodigo">
                      Región {requiereDireccion ? '*' : ''}
                    </Label>
                    <select
                      id="regionCodigo"
                      name="regionCodigo"
                      className={selectClase}
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
                  <div>
                    <Label htmlFor="comuna">Comuna {requiereDireccion ? '*' : ''}</Label>
                    <select
                      id="comuna"
                      name="comuna"
                      className={selectClase}
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
                  <div className="sm:col-span-2">
                    <Label htmlFor="direccion">Dirección {requiereDireccion ? '*' : ''}</Label>
                    <Input
                      id="direccion"
                      name="direccion"
                      value={formulario.direccion}
                      onChange={actualizarCampo}
                      maxLength={200}
                      placeholder="Calle, número, departamento o referencia"
                      required={requiereDireccion}
                      disabled={!requiereDireccion}
                    />
                  </div>
                </div>

                <h3 className="mt-2 text-sm font-bold">Método de despacho</h3>
                {cargandoOpciones && (
                  <p className="text-sm text-muted-foreground">Calculando costos de envío...</p>
                )}
                {Boolean(errorOpciones) && <ErrorAlert error={errorOpciones} />}
                <div className="grid gap-3 sm:grid-cols-3">
                  {metodos.map((metodo) => {
                    const opcion = opciones?.opciones.find(
                      (item) => item.metodoCodigo === metodo.codigo,
                    )
                    const disponible = Boolean(opcion) || metodo.codigo === 'retiro'
                    const activo = formulario.metodoDespacho === metodo.codigo
                    return (
                      <button
                        key={metodo.codigo}
                        type="button"
                        className={opcionClase(activo)}
                        onClick={() => seleccionarMetodo(metodo.codigo)}
                        disabled={!disponible}
                        aria-pressed={activo}
                      >
                        <span className="block font-bold">{metodo.nombre}</span>
                        <span className="block text-xs text-muted-foreground">
                          {metodo.descripcion}
                        </span>
                        <span className="mt-2 block text-sm font-bold text-primary">
                          {opcion
                            ? opcion.costoEnvio === 0
                              ? 'Sin costo'
                              : formatCLP(opcion.costoEnvio)
                            : metodo.codigo === 'retiro'
                              ? 'Sin costo'
                              : 'Selecciona región'}
                        </span>
                        {opcion && (
                          <span className="block text-xs text-muted-foreground">
                            {opcion.diasHabiles} día{opcion.diasHabiles === 1 ? '' : 's'} hábil
                            {opcion.diasHabiles === 1 ? '' : 'es'}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
                {metodos.length === 0 && (
                  <Alert variant="warning">
                    <AlertDescription>No hay métodos de despacho disponibles.</AlertDescription>
                  </Alert>
                )}
              </Card>

              <Card className="gap-4 p-5 sm:p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <CreditCard className="size-5 text-primary" aria-hidden="true" />
                  Pago
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className={opcionClase(formulario.metodoPago === 'tarjeta')}
                    onClick={() =>
                      setFormulario((actual) => ({ ...actual, metodoPago: 'tarjeta' }))
                    }
                    aria-pressed={formulario.metodoPago === 'tarjeta'}
                  >
                    <span className="flex items-center gap-2 font-bold">
                      <CreditCard className="size-4" aria-hidden="true" />
                      Tarjeta de crédito o débito
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Pago simulado para esta versión local.
                    </span>
                  </button>
                  <button
                    type="button"
                    className={opcionClase(formulario.metodoPago === 'transferencia')}
                    onClick={() =>
                      setFormulario((actual) => ({ ...actual, metodoPago: 'transferencia' }))
                    }
                    aria-pressed={formulario.metodoPago === 'transferencia'}
                  >
                    <span className="flex items-center gap-2 font-bold">
                      <Banknote className="size-4" aria-hidden="true" />
                      Transferencia bancaria
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      Recibirás los datos por correo (registrado en log).
                    </span>
                  </button>
                </div>
                <Alert variant="info" className="text-xs">
                  <Info aria-hidden="true" />
                  <AlertDescription>
                    El pago es simulado: no se cobrará dinero real. El pedido quedará registrado y
                    podrás descargar tu comprobante.
                  </AlertDescription>
                </Alert>
              </Card>
            </div>

            <div>
              <Card className="gap-3 p-5 lg:sticky lg:top-24">
                <h2 className="flex items-center gap-2 text-lg font-bold">
                  <Package className="size-5 text-primary" aria-hidden="true" />
                  Resumen del pedido
                </h2>
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li key={item.producto.id} className="flex gap-2">
                      <img
                        src={assetUrl(item.producto.imagen)}
                        alt=""
                        width={52}
                        height={52}
                        className="size-13 shrink-0 rounded-lg object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {item.producto.nombre}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.cantidad} × {formatCLP(item.producto.precio)}
                        </span>
                      </div>
                      <span className="text-sm font-bold">
                        {formatCLP(Number(item.producto.precio) * item.cantidad)}
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Subtotal productos</dt>
                    <dd>{formatCLP(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Costo de envío</dt>
                    <dd>
                      {opcionSeleccionada
                        ? opcionSeleccionada.costoEnvio === 0
                          ? 'Sin costo'
                          : formatCLP(opcionSeleccionada.costoEnvio)
                        : formulario.metodoDespacho === 'retiro'
                          ? 'Sin costo'
                          : 'Por calcular'}
                    </dd>
                  </div>
                </dl>
                <hr className="border-border" />
                <div className="flex items-center justify-between">
                  <span className="font-bold">Total a pagar</span>
                  <span className="font-display text-2xl font-extrabold text-primary">
                    {formatCLP(total)}
                  </span>
                </div>
                {regionSeleccionada && formulario.comuna && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {formulario.comuna}, {regionSeleccionada.nombre}
                  </p>
                )}
                <Button
                  type="submit"
                  size="lg"
                  variant="accent"
                  className="w-full"
                  disabled={enviando || hayProblemaStock}
                >
                  {enviando ? (
                    <>
                      <Spinner className="size-4" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" aria-hidden="true" />
                      Pagar y generar pedido
                    </>
                  )}
                </Button>
                <Button asChild variant="ghost" className="w-full">
                  <Link to="/carrito">Volver al carrito</Link>
                </Button>
              </Card>
            </div>
          </form>
        </div>
      </section>
    </>
  )
}
