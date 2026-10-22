import type { ConsultaRequest, ConsultaResponse } from '../types/api'
import { request } from './http'

export const consultaService = {
  crear(datos: ConsultaRequest) {
    return request<ConsultaResponse>('/api/consultas', {
      method: 'POST',
      body: datos,
    })
  },
}
