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
    <div className="alert alert-danger d-flex justify-content-between align-items-start" role="alert">
      <span>{mensajeDeError(error)}</span>
      {onClose && (
        <button type="button" className="btn-close ms-3" aria-label="Cerrar" onClick={onClose} />
      )}
    </div>
  )
}
