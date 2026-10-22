import type { LoginResponse, RegistroRequest, Usuario } from '../types/api'
import { request } from './http'

export const authService = {
  login(correo: string, clave: string) {
    return request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { correo, clave },
    })
  },

  registrar(datos: RegistroRequest) {
    return request<Usuario>('/api/auth/registro', {
      method: 'POST',
      body: datos,
    })
  },

  confirmar(token: string) {
    return request<{ mensaje: string }>(`/api/auth/confirmar?token=${encodeURIComponent(token)}`)
  },
}
