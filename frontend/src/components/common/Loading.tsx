import { Spinner } from '@/components/ui/spinner'

export function Loading({ texto = 'Cargando...' }: { texto?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12" role="status">
      <Spinner className="size-8 text-brand" />
      <p className="mb-0 text-sm text-muted-foreground">{texto}</p>
    </div>
  )
}
