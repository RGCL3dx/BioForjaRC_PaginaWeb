import type {
  CotizacionEnvioRequest,
  CotizacionEnvioResponse,
  MetodoDespacho,
  OpcionesEnvio,
  Region,
} from '../types/api'
import { buildQuery, request } from './http'

export const envioService = {
  listarRegiones() {
    return request<Region[]>('/api/envios/regiones')
  },

  listarComunas(regionCodigo: string) {
    return request<Region['comunas']>(`/api/envios/regiones/${encodeURIComponent(regionCodigo)}/comunas`)
  },

  listarMetodos() {
    return request<MetodoDespacho[]>('/api/envios/metodos-despacho')
  },

  opciones(params: { regionCodigo?: string; comuna?: string; subtotal: number }) {
    return request<OpcionesEnvio>(`/api/envios/opciones${buildQuery(params)}`)
  },

  cotizar(datos: CotizacionEnvioRequest) {
    return request<CotizacionEnvioResponse>('/api/envios/cotizar', {
      method: 'POST',
      body: datos,
    })
  },
}
