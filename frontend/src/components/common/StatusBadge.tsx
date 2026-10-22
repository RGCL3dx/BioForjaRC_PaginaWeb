import {
  estadoCotizacionClass,
  estadoPedidoClass,
  estadoUsuarioClass,
} from '../../utils/format'

export function PedidoBadge({ estado }: { estado: string }) {
  return <span className={`badge rounded-pill ${estadoPedidoClass(estado)}`}>{estado}</span>
}

export function CotizacionBadge({ estado }: { estado: string }) {
  return <span className={`badge rounded-pill ${estadoCotizacionClass(estado)}`}>{estado}</span>
}

export function UsuarioBadge({ estado }: { estado: string }) {
  return <span className={`badge rounded-pill ${estadoUsuarioClass(estado)}`}>{estado}</span>
}
