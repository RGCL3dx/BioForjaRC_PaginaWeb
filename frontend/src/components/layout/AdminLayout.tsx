import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ScrollToTop } from './ScrollToTop'

const enlacesAdmin = [
  { to: '/admin', label: 'Panel', end: true },
  { to: '/admin/inventario', label: 'Inventario' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/cotizaciones', label: 'Cotizaciones' },
]

export function AdminLayout() {
  const { usuario, logout } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const cerrarSesion = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="d-flex min-vh-100 flex-column">
      <ScrollToTop />
      <header>
        <nav className="navbar navbar-expand-lg bg-white shadow-sm navbar-marca" aria-label="Navegación de administración">
          <div className="container">
            <Link className="navbar-brand d-flex align-items-center gap-2 py-2" to="/admin">
              <img src="/assets/imagenes/LOGO.jpg" alt="Logo de BioForjaRC" width="46" height="46" className="rounded-circle" />
              <span className="fw-bold fs-5 text-tinta">
                BioForja<strong className="texto-acento">RC</strong>
                <span className="badge bg-warning text-dark ms-2 align-middle">Admin</span>
              </span>
            </Link>
            <button
              className="navbar-toggler border-0"
              type="button"
              aria-controls="menuAdmin"
              aria-expanded={menuAbierto}
              aria-label="Abrir menú"
              onClick={() => setMenuAbierto((abierto) => !abierto)}
            >
              <span className="navbar-toggler-icon" />
            </button>
            <div className={`collapse navbar-collapse ${menuAbierto ? 'show' : ''}`} id="menuAdmin">
              <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
                {enlacesAdmin.map((enlace) => (
                  <li className="nav-item" key={enlace.to}>
                    <NavLink
                      to={enlace.to}
                      end={enlace.end}
                      onClick={() => setMenuAbierto(false)}
                      className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    >
                      {enlace.label}
                    </NavLink>
                  </li>
                ))}
                <li className="nav-item">
                  <Link className="nav-link" to="/">Volver al sitio</Link>
                </li>
                <li className="nav-item">
                  <span className="nav-link disabled">{usuario?.nombre} {usuario?.apellido}</span>
                </li>
                <li className="nav-item">
                  <button type="button" className="nav-link btn btn-link" onClick={cerrarSesion}>Salir</button>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>
      <main className="flex-grow-1">
        <Outlet />
      </main>
      <footer className="bg-marca text-light py-3 mt-auto">
        <div className="container small text-white-50 d-flex flex-wrap justify-content-between gap-2">
          <span>Panel de administración BioForjaRC</span>
          <span>{location.pathname}</span>
        </div>
      </footer>
    </div>
  )
}
