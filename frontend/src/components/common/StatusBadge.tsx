import { Badge } from '@/components/ui/badge'

type VarianteEstado = 'success' | 'warning' | 'info' | 'destructive' | 'muted'

function variantePedido(estado: string): VarianteEstado {
  switch (estado) {
    case 'Entregado':
      return 'success'
    case 'Despachado':
      return 'info'
    case 'Cancelado':
      return 'destructive'
    default:
      return 'warning'
  }
}

function varianteCotizacion(estado: string): VarianteEstado {
  return estado === 'Presupuestada' ? 'success' : 'warning'
}

function varianteUsuario(estado: string): VarianteEstado {
  return estado === 'Activo' ? 'success' : 'muted'
}

export function PedidoBadge({ estado }: { estado: string }) {
  return <Badge variant={variantePedido(estado)}>{estado}</Badge>
}

export function CotizacionBadge({ estado }: { estado: string }) {
  return <Badge variant={varianteCotizacion(estado)}>{estado}</Badge>
}

export function UsuarioBadge({ estado }: { estado: string }) {
  return <Badge variant={varianteUsuario(estado)}>{estado}</Badge>
}
