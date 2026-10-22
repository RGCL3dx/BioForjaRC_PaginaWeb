import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="py-5">
      <div className="container text-center py-5">
        <i className="bi bi-compass fs-1 text-marca" aria-hidden="true" />
        <h1 className="titulo-seccion mt-3">Página no encontrada</h1>
        <p className="pagina-intro">
          La dirección que intentaste abrir no existe o fue movida.
        </p>
        <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
          <Link to="/" className="btn btn-marca rounded-pill px-4">
            Volver al inicio
          </Link>
          <Link to="/productos" className="btn btn-marca-outline rounded-pill px-4">
            Ver productos
          </Link>
        </div>
      </div>
    </section>
  )
}
