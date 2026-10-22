import type {
  CotizacionDetalle,
  CotizacionRequest,
  CotizacionResumen,
  PaginaResponse,
  PresupuestoRequest,
} from '../types/api'
import { buildQuery, download, request } from './http'

export interface ListarCotizacionesParams {
  q?: string
  estado?: string
  desde?: string
  hasta?: string
  pagina?: number
  tamano?: number
}

export const cotizacionService = {
  crear(datos: CotizacionRequest) {
    const form = new FormData()
    form.append('nombre', datos.nombre)
    form.append('apellido', datos.apellido)
    form.append('correo', datos.correo)
    if (datos.telefono) form.append('telefono', datos.telefono)
    form.append('categoria', datos.categoria)
    if (datos.cantidad) form.append('cantidad', String(datos.cantidad))
    if (datos.plazo) form.append('plazo', datos.plazo)
    form.append('descripcion', datos.descripcion)
    datos.archivos.forEach((archivo) => form.append('archivos', archivo))

    return request<CotizacionDetalle>('/api/cotizaciones', {
      method: 'POST',
      body: form,
    })
  },

  listarAdmin(params: ListarCotizacionesParams = {}) {
    return request<PaginaResponse<CotizacionResumen>>(
      `/api/cotizaciones${buildQuery({
        q: params.q,
        estado: params.estado,
        desde: params.desde,
        hasta: params.hasta,
        pagina: params.pagina ?? 0,
        tamano: params.tamano ?? 20,
      })}`,
    )
  },

  obtener(id: number) {
    return request<CotizacionDetalle>(`/api/cotizaciones/${id}`)
  },

  descargarArchivo(archivoId: number, nombre: string) {
    return download(`/api/cotizaciones/archivos/${archivoId}`, nombre)
  },

  presupuestar(id: number, datos: PresupuestoRequest) {
    return request<CotizacionDetalle>(`/api/cotizaciones/${id}/presupuesto`, {
      method: 'POST',
      body: datos,
    })
  },
}
