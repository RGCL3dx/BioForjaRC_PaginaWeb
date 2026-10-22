import type {
  CrearPedidoRequest,
  EstadoPedido,
  PaginaResponse,
  PedidoDetalle,
  PedidoResumen,
} from '../types/api'
import { buildQuery, download, request } from './http'

export interface ListarPedidosParams {
  q?: string
  estado?: string
  desde?: string
  hasta?: string
  pagina?: number
  tamano?: number
}

export const pedidoService = {
  crear(datos: CrearPedidoRequest) {
    return request<PedidoDetalle>('/api/pedidos', {
      method: 'POST',
      body: datos,
    })
  },

  listarMios() {
    return request<PedidoResumen[]>('/api/pedidos/mios')
  },

  listarAdmin(params: ListarPedidosParams = {}) {
    return request<PaginaResponse<PedidoResumen>>(
      `/api/pedidos${buildQuery({
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
    return request<PedidoDetalle>(`/api/pedidos/${id}`)
  },

  cambiarEstado(id: number, estado: EstadoPedido) {
    return request<PedidoDetalle>(`/api/pedidos/${id}/estado`, {
      method: 'PATCH',
      body: { estado },
    })
  },

  descargarComprobante(id: number, numeroOrden?: string) {
    return download(`/api/pedidos/${id}/comprobante`, `comprobante-${numeroOrden ?? id}.pdf`)
  },
}
