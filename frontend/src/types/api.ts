export type Rol = 'administrador' | 'cliente'
export type EstadoUsuario = 'Activo' | 'Inactivo'
export type TipoDocumento = 'boleta' | 'factura'
export type MetodoPago = 'tarjeta' | 'transferencia'
export type EstadoPedido = 'En preparación' | 'Despachado' | 'Entregado' | 'Cancelado'
export type EstadoPago = 'Pagado' | 'Pendiente' | 'Fallido'
export type EstadoCotizacion = 'Pendiente' | 'Presupuestada'

export interface ErrorResponse {
  timestamp?: string
  status: number
  error: string
  mensaje: string
  ruta?: string
  detalles?: Record<string, string>
}

export interface Direccion {
  id: number
  region: string
  comuna: string
  calle: string
  numero: string
  departamento?: string | null
  referencia?: string | null
  principal: boolean
}

export interface DireccionRequest {
  region: string
  comuna: string
  calle: string
  numero: string
  departamento?: string
  referencia?: string
  principal: boolean
}

export interface Usuario {
  id: number
  nombre: string
  apellido: string
  rut: string
  correo: string
  telefono?: string | null
  rol: Rol
  estado: EstadoUsuario
  fechaRegistro: string
  correoConfirmado: boolean
  direcciones: Direccion[]
}

export interface LoginResponse {
  token: string
  tipo: string
  expiraEn: number
  usuario: Usuario
}

export interface RegistroRequest {
  nombre: string
  apellido: string
  rut: string
  correo: string
  telefono?: string
  clave: string
}

export interface UsuarioActualizacionRequest {
  nombre: string
  apellido: string
  rut: string
  correo: string
  telefono?: string
  rol?: Rol
}

export interface Categoria {
  id: number
  nombre: string
  slug: string
  descripcion?: string | null
}

export interface ProductoResumen {
  id: number
  nombre: string
  descripcion: string
  precio: number
  stock: number
  stockBajo: boolean
  categoria: Categoria
  imagen: string
  activo: boolean
}

export interface ProductoDetalle extends ProductoResumen {
  imagenes: string[]
  material?: string | null
  dimensiones?: string | null
  fechaRegistro: string
  fechaActualizacion: string
}

export interface PaginaResponse<T> {
  contenido: T[]
  pagina: number
  tamano: number
  totalElementos: number
  totalPaginas: number
  primera: boolean
  ultima: boolean
}

export interface ProductoRequest {
  nombre: string
  descripcion: string
  precio: number
  stock: number
  categoriaSlug: string
  material?: string
  dimensiones?: string
  imagen: string
  imagenes?: string[]
}

export interface ResumenInventario {
  totalProductos: number
  activos: number
  inactivos: number
  stockBajo: number
  unidadesDisponibles: number
}

export interface Comuna {
  id: number
  nombre: string
  slug: string
}

export interface Region {
  id: number
  codigo: string
  nombre: string
  comunas: Comuna[]
}

export interface MetodoDespacho {
  id: number
  codigo: string
  nombre: string
  descripcion?: string | null
  requiereDireccion: boolean
  orden: number
}

export interface OpcionEnvio {
  metodoCodigo: string
  metodoNombre: string
  metodoDescripcion?: string | null
  costoEnvio: number
  total: number
  diasHabiles: number
  requiereDireccion: boolean
  origenTarifa?: string | null
}

export interface OpcionesEnvio {
  regionCodigo?: string | null
  regionNombre?: string | null
  comuna?: string | null
  subtotal: number
  opciones: OpcionEnvio[]
}

export interface CotizacionEnvioRequest {
  regionCodigo?: string
  comuna?: string
  metodoCodigo: string
  subtotal: number
}

export interface CotizacionEnvioResponse {
  regionCodigo?: string | null
  regionNombre?: string | null
  comuna?: string | null
  metodoCodigo: string
  metodoNombre: string
  metodoDescripcion?: string | null
  subtotal: number
  costoEnvio: number
  total: number
  diasHabiles: number
  requiereDireccion: boolean
  origenTarifa?: string | null
}

export interface ItemPedidoRequest {
  productoId: number
  cantidad: number
}

export interface CrearPedidoRequest {
  nombre: string
  apellido: string
  telefono?: string
  rut?: string
  documentoTipo: TipoDocumento
  rutFacturacion?: string
  razonSocial?: string
  giro?: string
  direccion?: string
  comuna?: string
  regionCodigo?: string
  metodoDespacho: string
  metodoPago: MetodoPago
  items: ItemPedidoRequest[]
}

export interface ItemPedido {
  productoId: number
  nombreProducto: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface PedidoResumen {
  id: number
  numeroOrden: string
  fechaCreacion: string
  correo: string
  cliente: string
  total: number
  estado: EstadoPedido
  estadoPago: EstadoPago
  metodoPago: string
  metodoDespacho: string
  cantidadProductos: number
  comprobanteUrl: string
}

export interface PedidoDetalle {
  id: number
  numeroOrden: string
  fechaCreacion: string
  fechaActualizacion: string
  estado: EstadoPedido
  estadoPago: EstadoPago
  metodoPago: string
  pagoSimulado: boolean
  referenciaPago: string
  fechaPago: string
  correo: string
  nombre: string
  apellido: string
  telefono?: string | null
  rut?: string | null
  documentoTipo: string
  rutFacturacion?: string | null
  razonSocial?: string | null
  giro?: string | null
  direccion?: string | null
  comuna?: string | null
  regionCodigo?: string | null
  regionNombre?: string | null
  metodoDespacho: string
  metodoDespachoNombre: string
  diasHabiles: number
  requiereDireccion: boolean
  subtotal: number
  costoEnvio: number
  total: number
  items: ItemPedido[]
  comprobanteUrl: string
}

export interface IngresoPeriodo {
  periodo: string
  pedidos: number
  monto: number
}

export interface ProductoVendido {
  productoId: number
  nombre: string
  unidades: number
  ingresos: number
}

export interface ReporteVentas {
  desde: string
  hasta: string
  totalVentas: number
  ticketPromedio: number
  cantidadPedidos: number
  unidadesVendidas: number
  ingresosPorDia: IngresoPeriodo[]
  ingresosPorMes: IngresoPeriodo[]
  topProductos: ProductoVendido[]
}

export interface ArchivoCotizacion {
  id: number
  nombreOriginal: string
  extension: string
  tipoContenido: string
  tamano: number
  tamanoLegible: string
  fechaCarga: string
  descargaUrl: string
}

export interface CotizacionResumen {
  id: number
  numeroTicket: string
  nombre: string
  apellido: string
  correo: string
  telefono?: string | null
  categoria: string
  cantidad?: number | null
  plazo?: string | null
  estado: EstadoCotizacion
  fechaCreacion: string
  cantidadArchivos: number
  montoTotal?: number | null
  plazoEntregaDias?: number | null
  enlacePago?: string | null
}

export interface CotizacionDetalle extends CotizacionResumen {
  descripcion: string
  fechaActualizacion: string
  observacionesPresupuesto?: string | null
  fechaPresupuesto?: string | null
  archivos: ArchivoCotizacion[]
}

export interface CotizacionRequest {
  nombre: string
  apellido: string
  correo: string
  telefono?: string
  categoria: string
  cantidad?: number
  plazo?: string
  descripcion: string
  archivos: File[]
}

export interface PresupuestoRequest {
  montoTotal: number
  plazoEntregaDias: number
  observaciones?: string
}

export interface ConsultaRequest {
  nombre: string
  correo: string
  telefono?: string
  asunto: string
  mensaje: string
}

export interface ConsultaResponse {
  id: number
  nombre: string
  correo: string
  asunto: string
  fechaEnvio: string
  mensajeConfirmacion: string
}
