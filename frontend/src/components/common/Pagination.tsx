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
    <nav className="mt-4" aria-label="Paginación">
      <ul className="pagination justify-content-center flex-wrap">
        <li className={`page-item ${pagina === 0 ? 'disabled' : ''}`}>
          <button type="button" className="page-link" onClick={() => onChange(pagina - 1)}>
            Anterior
          </button>
        </li>
        {paginas.map((indice, posicion) => {
          const anterior = paginas[posicion - 1]
          return (
            <li key={indice} className="page-item d-flex align-items-center">
              {anterior !== undefined && indice - anterior > 1 && (
                <span className="px-2 text-muted">…</span>
              )}
              <button
                type="button"
                className={`page-link ${pagina === indice ? 'active' : ''}`}
                onClick={() => onChange(indice)}
                aria-current={pagina === indice ? 'page' : undefined}
              >
                {indice + 1}
              </button>
            </li>
          )
        })}
        <li className={`page-item ${pagina >= totalPaginas - 1 ? 'disabled' : ''}`}>
          <button type="button" className="page-link" onClick={() => onChange(pagina + 1)}>
            Siguiente
          </button>
        </li>
      </ul>
    </nav>
  )
}
