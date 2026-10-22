import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { RegistroRequest, Usuario } from '../types/api'
import { authService } from '../services/auth'
import { usuarioService } from '../services/usuarios'
import {
  ApiError,
  USER_KEY,
  TOKEN_KEY,
  clearSessionStorage,
  getToken,
  setToken,
} from '../services/http'

interface AuthContextValue {
  usuario: Usuario | null
  token: string | null
  cargando: boolean
  esAdmin: boolean
  login: (correo: string, clave: string) => Promise<Usuario>
  registrar: (datos: RegistroRequest) => Promise<Usuario>
  logout: () => void
  actualizarUsuario: (usuario: Usuario) => void
  refrescarUsuario: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function leerUsuarioGuardado(): Usuario | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as Usuario) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => leerUsuarioGuardado())
  const [token, setTokenState] = useState<string | null>(() => getToken())
  const [cargando, setCargando] = useState(false)

  const guardarUsuario = useCallback((nuevo: Usuario) => {
    setUsuario(nuevo)
    localStorage.setItem(USER_KEY, JSON.stringify(nuevo))
  }, [])

  const logout = useCallback(() => {
    clearSessionStorage()
    setUsuario(null)
    setTokenState(null)
  }, [])

  const actualizarUsuario = useCallback(
    (nuevo: Usuario) => {
      guardarUsuario(nuevo)
    },
    [guardarUsuario],
  )

  const login = useCallback(
    async (correo: string, clave: string) => {
      const respuesta = await authService.login(correo.trim(), clave)
      setToken(respuesta.token)
      setTokenState(respuesta.token)
      guardarUsuario(respuesta.usuario)
      return respuesta.usuario
    },
    [guardarUsuario],
  )

  const registrar = useCallback(
    async (datos: RegistroRequest) => {
      await authService.registrar(datos)
      return login(datos.correo, datos.clave)
    },
    [login],
  )

  const refrescarUsuario = useCallback(async () => {
    if (!token || !usuario) return
    setCargando(true)
    try {
      const actualizado = await usuarioService.obtener(usuario.id)
      guardarUsuario(actualizado)
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        logout()
      }
    } finally {
      setCargando(false)
    }
  }, [guardarUsuario, logout, token, usuario])

  useEffect(() => {
    const onExpired = () => logout()
    window.addEventListener('bioforja:session-expired', onExpired)
    return () => window.removeEventListener('bioforja:session-expired', onExpired)
  }, [logout])

  useEffect(() => {
    if (!getToken() && !token) return
    if (token && usuario) {
      void refrescarUsuario()
    }
    // Solo al iniciar la aplicación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === USER_KEY) {
        setTokenState(getToken())
        setUsuario(leerUsuarioGuardado())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      token,
      cargando,
      esAdmin: usuario?.rol === 'administrador',
      login,
      registrar,
      logout,
      actualizarUsuario,
      refrescarUsuario,
    }),
    [usuario, token, cargando, login, registrar, logout, actualizarUsuario, refrescarUsuario],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
