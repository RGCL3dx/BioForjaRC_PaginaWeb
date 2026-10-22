import type {
  Direccion,
  DireccionRequest,
  EstadoUsuario,
  Usuario,
  UsuarioActualizacionRequest,
} from '../types/api'
import { buildQuery, request } from './http'

export const usuarioService = {
  listar(q?: string) {
    return request<Usuario[]>(`/api/usuarios${buildQuery({ q })}`)
  },

  obtener(id: number) {
    return request<Usuario>(`/api/usuarios/${id}`)
  },

  actualizar(id: number, datos: UsuarioActualizacionRequest) {
    return request<Usuario>(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: datos,
    })
  },

  cambiarEstado(id: number, estado: EstadoUsuario) {
    return request<Usuario>(`/api/usuarios/${id}/estado`, {
      method: 'PATCH',
      body: { estado },
    })
  },

  listarDirecciones(usuarioId: number) {
    return request<Direccion[]>(`/api/usuarios/${usuarioId}/direcciones`)
  },

  crearDireccion(usuarioId: number, datos: DireccionRequest) {
    return request<Direccion>(`/api/usuarios/${usuarioId}/direcciones`, {
      method: 'POST',
      body: datos,
    })
  },

  actualizarDireccion(usuarioId: number, direccionId: number, datos: DireccionRequest) {
    return request<Direccion>(`/api/usuarios/${usuarioId}/direcciones/${direccionId}`, {
      method: 'PUT',
      body: datos,
    })
  },

  eliminarDireccion(usuarioId: number, direccionId: number) {
    return request<void>(`/api/usuarios/${usuarioId}/direcciones/${direccionId}`, {
      method: 'DELETE',
    })
  },

  marcarPrincipal(usuarioId: number, direccionId: number) {
    return request<Direccion>(`/api/usuarios/${usuarioId}/direcciones/${direccionId}/principal`, {
      method: 'PATCH',
    })
  },
}
