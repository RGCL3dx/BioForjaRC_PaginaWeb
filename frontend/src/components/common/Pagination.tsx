import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  pagina: number
  totalPaginas: number
  onChange: (pagina: number) => void
}

export function Pagination({ pagina, totalPaginas, onChange }: PaginationProps) {
  if (totalPaginas <= 1) return null
  const paginas = Array.from({ length: totalPaginas }, (_, index) => index).filter(
    (indice) => indice === 0 || indice === totalPaginas - 1 || Math.abs(indice - pagina) <= 2,
  )

  return (
    <nav className="mt-6 flex justify-center" aria-label="Paginación">
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(pagina - 1)}
          disabled={pagina === 0}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Anterior
        </Button>
        {paginas.map((indice, posicion) => {
          const anterior = paginas[posicion - 1]
          return (
            <span key={indice} className="flex items-center gap-1.5">
              {anterior !== undefined && indice - anterior > 1 && (
                <span className="px-1 text-muted-foreground">…</span>
              )}
              <Button
                type="button"
                variant={pagina === indice ? 'default' : 'outline'}
                size="icon"
                onClick={() => onChange(indice)}
                aria-current={pagina === indice ? 'page' : undefined}
                aria-label={`Ir a la página ${indice + 1}`}
                className={cn('size-9', pagina === indice && 'pointer-events-none')}
              >
                {indice + 1}
              </Button>
            </span>
          )
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(pagina + 1)}
          disabled={pagina >= totalPaginas - 1}
        >
          Siguiente
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
