import { Link, Outlet } from 'react-router-dom'
import { Mail, MapPin, Phone, Recycle, Settings, ShoppingCart, UserRound } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Navbar } from './Navbar'
import { ScrollToTop } from './ScrollToTop'

export function Layout() {
  const { esAdmin } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="footer-brand mt-auto pt-12 pb-6">
        <div className="container-page">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.2fr_1fr]">
            <div>
              <Link to="/" className="mb-3 flex items-center gap-2 text-white">
                <img
                  src="/assets/imagenes/LOGO.jpg"
                  alt="Logo de BioForjaRC"
                  width={42}
                  height={42}
                  className="size-11 rounded-full object-cover ring-2 ring-white/30"
                />
                <span className="font-display text-lg font-bold">
                  BioForja<span className="text-amber-brand">RC</span>
                </span>
              </Link>
              <p className="max-w-xs text-sm text-white/60">
                Productos sostenibles impresos en 3D a partir de plástico reciclado.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
                <Recycle className="size-3.5" aria-hidden="true" />
                Economía circular
              </p>
            </div>

            <div>
              <h2 className="mb-3 font-display text-sm font-bold tracking-wide text-white uppercase">
                Explorar
              </h2>
              <ul className="space-y-2 text-sm">
                {[
                  { to: '/', label: 'Inicio' },
                  { to: '/productos', label: 'Productos' },
                  { to: '/nosotros', label: 'Nosotros' },
                  { to: '/cotizacion', label: 'Cotización' },
                  { to: '/contacto', label: 'Contacto' },
                ].map((enlace) => (
                  <li key={enlace.to}>
                    <Link to={enlace.to} className="text-white/60 transition-colors hover:text-white">
                      {enlace.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-3 font-display text-sm font-bold tracking-wide text-white uppercase">
                Contacto
              </h2>
              <ul className="space-y-2.5 text-sm text-white/60">
                <li className="flex items-center gap-2">
                  <Phone className="size-4 text-amber-brand" aria-hidden="true" />
                  <a href="tel:+56912345678" className="transition-colors hover:text-white">
                    +56 9 1234 5678
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="size-4 text-amber-brand" aria-hidden="true" />
                  <a
                    href="mailto:contacto@bioforjarc.cl"
                    className="transition-colors hover:text-white"
                  >
                    contacto@bioforjarc.cl
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="size-4 text-amber-brand" aria-hidden="true" />
                  Santiago, Chile
                </li>
              </ul>
            </div>

            <div>
              <h2 className="mb-3 font-display text-sm font-bold tracking-wide text-white uppercase">
                Cuenta
              </h2>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/mi-cuenta"
                    className="inline-flex items-center gap-2 text-white/60 transition-colors hover:text-white"
                  >
                    <UserRound className="size-4" aria-hidden="true" />
                    Mi cuenta
                  </Link>
                </li>
                <li>
                  <Link
                    to="/carrito"
                    className="inline-flex items-center gap-2 text-white/60 transition-colors hover:text-white"
                  >
                    <ShoppingCart className="size-4" aria-hidden="true" />
                    Carrito
                  </Link>
                </li>
                {esAdmin && (
                  <li>
                    <Link
                      to="/admin"
                      className="inline-flex items-center gap-2 text-white/60 transition-colors hover:text-white"
                    >
                      <Settings className="size-4" aria-hidden="true" />
                      Panel de administración
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <hr className="my-6 border-white/15" />
          <div className="flex flex-col justify-between gap-2 text-xs text-white/50 sm:flex-row">
            <span>© {new Date().getFullYear()} BioForjaRC. Todos los derechos reservados.</span>
            <span>Reciclaje + impresión 3D = economía circular.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
