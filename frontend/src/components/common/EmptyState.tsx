import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

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
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
      <span className="mb-2 flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Inbox className="size-7" aria-hidden="true" />
      </span>
      <h2 className="text-lg font-bold text-brand-dark">{titulo}</h2>
      {descripcion && <p className="max-w-md text-sm text-muted-foreground">{descripcion}</p>}
      {accion && <div className="mt-3">{accion}</div>}
    </div>
  )
}
