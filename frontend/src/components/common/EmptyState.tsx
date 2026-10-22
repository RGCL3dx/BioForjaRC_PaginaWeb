import type { ReactNode } from 'react'

export function EmptyState({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string
  descripcion?: string
  accion?: ReactNode
}) {
  return (
    <div className="text-center py-5">
      <i className="bi bi-inbox fs-1 text-marca d-block mb-3" aria-hidden="true" />
      <h2 className="h5 fw-bold">{titulo}</h2>
      {descripcion && <p className="texto-gris">{descripcion}</p>}
      {accion}
    </div>
  )
}
