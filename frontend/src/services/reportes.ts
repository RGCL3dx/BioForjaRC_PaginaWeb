import type { ReporteVentas } from '../types/api'
import { buildQuery, download, request } from './http'

export const reporteService = {
  ventas(desde?: string, hasta?: string) {
    return request<ReporteVentas>(`/api/reportes/ventas${buildQuery({ desde, hasta })}`)
  },

  exportar(desde: string | undefined, hasta: string | undefined, formato: 'xlsx' | 'pdf') {
    const query = buildQuery({ desde, hasta, formato })
    return download(`/api/reportes/ventas/exportar${query}`, `reporte-ventas.${formato}`)
  },
}
