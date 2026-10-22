const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const number = new Intl.NumberFormat('es-CL')

export function formatCLP(value: number | null | undefined): string {
  return clp.format(Number(value ?? 0))
}

export function formatNumber(value: number | null | undefined): string {
  return number.format(Number(value ?? 0))
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = soloFecha
    ? new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]))
    : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function assetUrl(path: string | null | undefined): string {
  if (!path) return '/assets/imagenes/SINIMAGEN.png'
  if (/^(https?:|data:|blob:)/i.test(path)) return path
  let clean = path.replace(/\\/g, '/')
  clean = clean.replace(/^(\.\.\/)+/, '')
  if (clean.startsWith('/')) return clean
  if (clean.startsWith('assets/')) return `/${clean}`
  if (clean.startsWith('imagenes/')) return `/assets/${clean}`
  return `/${clean}`
}

export function estadoPedidoClass(estado: string): string {
  switch (estado) {
    case 'Entregado':
      return 'text-bg-success'
    case 'Despachado':
      return 'text-bg-info'
    case 'Cancelado':
      return 'text-bg-danger'
    default:
      return 'text-bg-warning'
  }
}

export function estadoCotizacionClass(estado: string): string {
  return estado === 'Presupuestada' ? 'text-bg-success' : 'text-bg-warning'
}

export function estadoUsuarioClass(estado: string): string {
  return estado === 'Activo' ? 'text-bg-success' : 'text-bg-secondary'
}

export function hoyISO(): string {
  const ahora = new Date()
  const mes = String(ahora.getMonth() + 1).padStart(2, '0')
  const dia = String(ahora.getDate()).padStart(2, '0')
  return `${ahora.getFullYear()}-${mes}-${dia}`
}
