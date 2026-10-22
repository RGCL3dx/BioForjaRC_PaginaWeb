import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type TipoNotificacion = 'success' | 'danger' | 'warning' | 'info'

interface Notificacion {
  id: number
  mensaje: string
  tipo: TipoNotificacion
}

interface NotificationContextValue {
  mostrar: (mensaje: string, tipo?: TipoNotificacion) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

  const mostrar = useCallback((mensaje: string, tipo: TipoNotificacion = 'info') => {
    const id = Date.now() + Math.random()
    setNotificaciones((actuales) => [...actuales, { id, mensaje, tipo }])
    window.setTimeout(() => {
      setNotificaciones((actuales) => actuales.filter((item) => item.id !== id))
    }, 4500)
  }, [])

  const value = useMemo(() => ({ mostrar }), [mostrar])

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1080 }}>
        {notificaciones.map((notificacion) => (
          <div
            key={notificacion.id}
            className={`toast show align-items-center text-bg-${notificacion.tipo} border-0 mb-2`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="d-flex">
              <div className="toast-body">{notificacion.mensaje}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Cerrar"
                onClick={() =>
                  setNotificaciones((actuales) =>
                    actuales.filter((item) => item.id !== notificacion.id),
                  )
                }
              />
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotification debe usarse dentro de NotificationProvider')
  return context
}
