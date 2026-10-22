import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Loading } from '../common/Loading'

export function RequireAuth() {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  // Solo bloqueamos la navegación mientras no exista una sesión restaurada.
  // Las recargas posteriores (por ejemplo al guardar una dirección) no deben
  // desmontar la página y perder el estado de sus pestañas.
  if (cargando && !usuario) return <Loading texto="Verificando sesión..." />
  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

export function RequireAdmin() {
  const { usuario, esAdmin, cargando } = useAuth()
  const location = useLocation()

  if (cargando && !usuario) return <Loading texto="Verificando permisos..." />
  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!esAdmin) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
