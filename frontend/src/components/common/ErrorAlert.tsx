import { X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ApiError } from '../../services/http'

export function mensajeDeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.details && Object.keys(error.details).length > 0) {
      return `${error.message}: ${Object.values(error.details).join(', ')}`
    }
    return error.message
  }
  if (error instanceof Error) return error.message
  return 'Ocurrió un error inesperado'
}

export function ErrorAlert({ error, onClose }: { error: unknown; onClose?: () => void }) {
  if (!error) return null
  return (
    <Alert variant="destructive" className="mb-4 flex items-start justify-between gap-3">
      <AlertDescription className="col-start-1">{mensajeDeError(error)}</AlertDescription>
      {onClose && (
        <button
          type="button"
          className="rounded-full p-1 transition-colors hover:bg-destructive/10"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      )}
    </Alert>
  )
}
