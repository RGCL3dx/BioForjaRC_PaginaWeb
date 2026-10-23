import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Navbar } from './Navbar'
import { ScrollToTop } from './ScrollToTop'

export function Layout() {
  const { esAdmin } = useAuth()

  return (
    <div className="d-flex min-vh-100 flex-column">
      <ScrollToTop />
      <Navbar />

      <main className="flex-grow-1">
        <Outlet />
      </main>

      <footer className="bg-marca text-light pt-5 pb-3 pie-pagina mt-auto">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <Link to="/" className="d-flex align-items-center gap-2 text-white text-decoration-none mb-3">
                <img src="/assets/imagenes/LOGO.jpg" alt="Logo de BioForjaRC" width="42" height="42" className="rounded-circle" />
                <span className="fw-bold fs-5">BioForja<strong className="texto-acento">RC</strong></span>
              </Link>
              <p className="text-white-50 small mb-0">
                Productos sostenibles impresos en 3D a partir de plástico reciclado.
              </p>
            </div>
            <div className="col-6 col-md-2">
              <h2 className="h6 text-uppercase fw-bold mb-3">Explorar</h2>
              <ul className="list-unstyled mb-0">
                <li className="mb-2"><Link to="/" className="text-white-50 text-decoration-none">Inicio</Link></li>
                <li className="mb-2"><Link to="/productos" className="text-white-50 text-decoration-none">Productos</Link></li>
                <li className="mb-2"><Link to="/nosotros" className="text-white-50 text-decoration-none">Nosotros</Link></li>
                <li className="mb-2"><Link to="/cotizacion" className="text-white-50 text-decoration-none">Cotización</Link></li>
                <li className="mb-2"><Link to="/contacto" className="text-white-50 text-decoration-none">Contacto</Link></li>
              </ul>
            </div>
            <div className="col-6 col-md-3">
              <h2 className="h6 text-uppercase fw-bold mb-3">Contacto</h2>
              <p className="mb-2"><i className="bi bi-telephone-fill me-2 pie-icono" aria-hidden="true" /><a href="tel:+56912345678" className="text-white-50 text-decoration-none">+56 9 1234 5678</a></p>
              <p className="mb-3"><i className="bi bi-envelope-fill me-2 pie-icono" aria-hidden="true" /><a href="mailto:contacto@bioforjarc.cl" className="text-white-50 text-decoration-none">contacto@bioforjarc.cl</a></p>
              <p className="mb-0 small text-white-50"><i className="bi bi-geo-alt-fill me-2 pie-icono" aria-hidden="true" />Santiago, Chile</p>
            </div>
            <div className="col-md-3">
              <h2 className="h6 text-uppercase fw-bold mb-3">Cuenta</h2>
              <ul className="list-unstyled mb-0">
                <li className="mb-2"><Link to="/mi-cuenta" className="text-white-50 text-decoration-none"><i className="bi bi-person me-2" aria-hidden="true" />Mi cuenta</Link></li>
                <li className="mb-2"><Link to="/carrito" className="text-white-50 text-decoration-none"><i className="bi bi-cart3 me-2" aria-hidden="true" />Carrito</Link></li>
                {esAdmin && (
                  <li className="mb-2"><Link to="/admin" className="text-white-50 text-decoration-none"><i className="bi bi-person-gear me-2" aria-hidden="true" />Panel de administración</Link></li>
                )}
              </ul>
            </div>
          </div>
          <hr className="border-light opacity-25 my-4" />
          <div className="d-flex flex-column flex-md-row justify-content-between gap-2 small text-white-50">
            <span>© {new Date().getFullYear()} BioForjaRC. Todos los derechos reservados.</span>
            <span>Reciclaje + impresión 3D = economía circular.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
