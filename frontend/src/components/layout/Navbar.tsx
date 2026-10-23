import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

const enlacesPublicos = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/productos', label: 'Productos' },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/cotizacion', label: 'Cotización' },
  { to: '/contacto', label: 'Contacto' },
]

const enlacesAdmin = [
  { to: '/admin', label: 'Panel', end: true },
  { to: '/admin/inventario', label: 'Inventario' },
  { to: '/admin/pedidos', label: 'Pedidos' },
  { to: '/admin/usuarios', label: 'Usuarios' },
  { to: '/admin/cotizaciones', label: 'Cotizaciones' },
]

interface NavbarProps {
  variante?: 'publica' | 'admin'
}

export function Navbar({ variante = 'publica' }: NavbarProps) {
  const { usuario, esAdmin, logout } = useAuth()
  const { cantidadTotal } = useCart()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const esAdminNav = variante === 'admin'
  const enlaces = esAdminNav ? enlacesAdmin : enlacesPublicos
  const idMenu = esAdminNav ? 'menuAdmin' : 'menuPrincipal'
  const etiquetaNav = esAdminNav ? 'Navegación de administración' : 'Navegación principal'

  useEffect(() => {
    setMenuAbierto(false)
  }, [location.pathname])

  const cerrarSesion = () => {
    logout()
    navigate('/')
  }

  return (
    <header>
      <nav className="navbar navbar-expand-lg bg-white shadow-sm navbar-marca" aria-label={etiquetaNav}>
        <div className="container">
          <Link
            className="navbar-brand d-flex align-items-center gap-2 py-2"
            to={esAdminNav ? '/admin' : '/'}
            aria-label={esAdminNav ? 'Ir al panel de administración' : 'Ir al inicio de BioForjaRC'}
          >
            <img
              src="/assets/imagenes/LOGO.jpg"
              alt="Logo de BioForjaRC"
              width="46"
              height="46"
              className="rounded-circle"
            />
            <span className="fw-bold fs-5 text-tinta">
              BioForja<strong className="texto-acento">RC</strong>
              {esAdminNav && <span className="badge bg-warning text-dark ms-2 align-middle">Admin</span>}
            </span>
          </Link>
          <button
            className="navbar-toggler border-0"
            type="button"
            aria-controls={idMenu}
            aria-expanded={menuAbierto}
            aria-label="Abrir menú"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className={`collapse navbar-collapse ${menuAbierto ? 'show' : ''}`} id={idMenu}>
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center">
              {enlaces.map((enlace) => (
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

              {esAdminNav ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/">
                      Volver al sitio
                    </Link>
                  </li>
                  <li className="nav-item">
                    <span className="nav-link disabled">
                      {usuario?.nombre} {usuario?.apellido}
                    </span>
                  </li>
                  <li className="nav-item">
                    <button type="button" className="nav-link btn btn-link" onClick={cerrarSesion}>
                      Salir
                    </button>
                  </li>
                </>
              ) : (
                <>
                  {usuario ? (
                    <>
                      {esAdmin && (
                        <li className="nav-item">
                          <NavLink
                            to="/admin"
                            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                          >
                            Administración
                          </NavLink>
                        </li>
                      )}
                      <li className="nav-item">
                        <NavLink
                          to="/mi-cuenta"
                          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                        >
                          Mi cuenta
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <button type="button" className="nav-link btn btn-link" onClick={cerrarSesion}>
                          Salir
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="nav-item">
                        <NavLink
                          to="/login"
                          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                        >
                          Ingresar
                        </NavLink>
                      </li>
                      <li className="nav-item">
                        <NavLink
                          to="/registro"
                          className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                        >
                          Registrarse
                        </NavLink>
                      </li>
                    </>
                  )}
                  <li className="nav-item">
                    <Link
                      className="btn btn-marca-outline rounded-pill px-3 mt-2 mb-2 mt-lg-0 mb-lg-0 ms-lg-2 position-relative"
                      to="/carrito"
                      aria-label="Ir al carrito de compras"
                    >
                      <i className="bi bi-cart3 me-1" aria-hidden="true" /> Carrito
                      {cantidadTotal > 0 && (
                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                          {cantidadTotal}
                          <span className="visually-hidden">productos en el carrito</span>
                        </span>
                      )}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
    </header>
  )
}
