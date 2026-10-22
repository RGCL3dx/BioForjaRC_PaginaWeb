export function Loading({ texto = 'Cargando...' }: { texto?: string }) {
  return (
    <div className="text-center py-5" role="status">
      <div className="spinner-border text-marca" aria-hidden="true" />
      <p className="texto-gris mt-3 mb-0">{texto}</p>
    </div>
  )
}
