import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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

const estilos: Record<TipoNotificacion, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  danger: 'border-red-200 bg-red-50 text-red-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
}

const iconos = {
  success: CheckCircle2,
  danger: AlertCircle,
  warning: TriangleAlert,
  info: Info,
} satisfies Record<TipoNotificacion, typeof Info>

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
      <div
        className="pointer-events-none fixed right-0 bottom-0 z-[70] flex w-full max-w-sm flex-col gap-2 p-4"
        aria-live="assertive"
        aria-atomic="true"
      >
        {notificaciones.map((notificacion) => {
          const Icono = iconos[notificacion.tipo]
          return (
            <div
              key={notificacion.id}
              role="alert"
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg',
                estilos[notificacion.tipo],
              )}
            >
              <Icono className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p className="flex-1">{notificacion.mensaje}</p>
              <button
                type="button"
                className="rounded-full p-1 transition-colors hover:bg-black/5"
                aria-label="Cerrar notificación"
                onClick={() =>
                  setNotificaciones((actuales) =>
                    actuales.filter((item) => item.id !== notificacion.id),
                  )
                }
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotification debe usarse dentro de NotificationProvider')
  return context
}
