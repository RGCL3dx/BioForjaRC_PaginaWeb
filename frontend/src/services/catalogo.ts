import type {
  Categoria,
  PaginaResponse,
  ProductoDetalle,
  ProductoRequest,
  ProductoResumen,
  ResumenInventario,
} from '../types/api'
import { buildQuery, request } from './http'

export interface ListarProductosParams {
  q?: string
  categorias?: string[]
  material?: string
  pagina?: number
  tamano?: number
}

export interface ListarInventarioParams {
  q?: string
  categorias?: string[]
  activo?: boolean
  pagina?: number
  tamano?: number
}

export const catalogoService = {
  listarProductos(params: ListarProductosParams = {}) {
    return request<PaginaResponse<ProductoResumen>>(
      `/api/productos${buildQuery({
        q: params.q,
        categorias: params.categorias,
        material: params.material,
        pagina: params.pagina ?? 0,
        tamano: params.tamano ?? 12,
      })}`,
    )
  },

  obtenerProducto(id: number) {
    return request<ProductoDetalle>(`/api/productos/${id}`)
  },

  listarCategorias() {
    return request<Categoria[]>('/api/categorias')
  },

  listarInventario(params: ListarInventarioParams = {}) {
    return request<PaginaResponse<ProductoResumen>>(
      `/api/productos/inventario${buildQuery({
        q: params.q,
        categorias: params.categorias,
        activo: params.activo,
        pagina: params.pagina ?? 0,
        tamano: params.tamano ?? 10,
      })}`,
    )
  },

  resumenInventario() {
    return request<ResumenInventario>('/api/productos/inventario/resumen')
  },

  obtenerInventario(id: number) {
    return request<ProductoDetalle>(`/api/productos/inventario/${id}`)
  },

  crearProducto(datos: ProductoRequest) {
    return request<ProductoDetalle>('/api/productos', {
      method: 'POST',
      body: datos,
    })
  },

  actualizarProducto(id: number, datos: ProductoRequest) {
    return request<ProductoDetalle>(`/api/productos/${id}`, {
      method: 'PUT',
      body: datos,
    })
  },

  cambiarEstadoProducto(id: number, activo: boolean) {
    return request<ProductoDetalle>(`/api/productos/${id}/estado`, {
      method: 'PATCH',
      body: { activo },
    })
  },
}
