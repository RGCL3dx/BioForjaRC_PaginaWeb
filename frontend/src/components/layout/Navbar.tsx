import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, LogOut, Menu, Settings, ShoppingCart, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
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

const enlaceClase = ({ isActive }: { isActive: boolean }) =>
  cn(
    'rounded-full px-3 py-2 font-display text-sm font-semibold transition-colors',
    isActive
      ? 'bg-brand/10 text-brand-dark'
      : 'text-foreground/75 hover:bg-secondary hover:text-brand-dark',
  )

export function Navbar({ variante = 'publica' }: NavbarProps) {
  const { usuario, esAdmin, logout } = useAuth()
  const { cantidadTotal } = useCart()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const esAdminNav = variante === 'admin'
  const enlaces = esAdminNav ? enlacesAdmin : enlacesPublicos
  const etiquetaNav = esAdminNav ? 'Navegación de administración' : 'Navegación principal'

  useEffect(() => {
    setMenuAbierto(false)
  }, [location.pathname])

  const cerrarSesion = () => {
    setMenuAbierto(false)
    logout()
    navigate('/')
  }

  const cerrarMenu = () => setMenuAbierto(false)

  const acciones = esAdminNav ? (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link to="/">Volver al sitio</Link>
      </Button>
      <span className="hidden items-center gap-1.5 px-2 text-sm text-muted-foreground sm:flex">
        <UserRound className="size-4" aria-hidden="true" />
        {usuario?.nombre} {usuario?.apellido}
      </span>
      <Button variant="outline" size="sm" onClick={cerrarSesion}>
        <LogOut className="size-4" aria-hidden="true" />
        Salir
      </Button>
    </>
  ) : (
    <>
      {usuario ? (
        <>
          {esAdmin && (
            <Button asChild variant="ghost" size="sm">
              <NavLink to="/admin" onClick={cerrarMenu}>
                <Settings className="size-4" aria-hidden="true" />
                Administración
              </NavLink>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <NavLink to="/mi-cuenta" onClick={cerrarMenu}>
              <UserRound className="size-4" aria-hidden="true" />
              Mi cuenta
            </NavLink>
          </Button>
          <Button variant="ghost" size="sm" onClick={cerrarSesion}>
            <LogOut className="size-4" aria-hidden="true" />
            Salir
          </Button>
        </>
      ) : (
        <>
          <Button asChild variant="ghost" size="sm">
            <NavLink to="/login" onClick={cerrarMenu}>
              <LogIn className="size-4" aria-hidden="true" />
              Ingresar
            </NavLink>
          </Button>
          <Button asChild variant="outline" size="sm">
            <NavLink to="/registro" onClick={cerrarMenu}>
              Registrarse
            </NavLink>
          </Button>
        </>
      )}
      <Button asChild variant="secondary" size="sm" className="relative">
        <Link to="/carrito" aria-label="Ir al carrito de compras">
          <ShoppingCart className="size-4" aria-hidden="true" />
          Carrito
          {cantidadTotal > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-1 size-5 justify-center rounded-full p-0 text-[10px]"
            >
              {cantidadTotal}
              <span className="sr-only">productos en el carrito</span>
            </Badge>
          )}
        </Link>
      </Button>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-white/95 shadow-sm backdrop-blur">
      <nav className="container-page flex h-16 items-center justify-between gap-3" aria-label={etiquetaNav}>
        <Link
          className="flex shrink-0 items-center gap-2 py-2"
          to={esAdminNav ? '/admin' : '/'}
          aria-label={esAdminNav ? 'Ir al panel de administración' : 'Ir al inicio de BioForjaRC'}
        >
          <img
            src="/assets/imagenes/LOGO.jpg"
            alt="Logo de BioForjaRC"
            width={44}
            height={44}
            className="size-11 rounded-full object-cover ring-2 ring-brand/20"
          />
          <span className="font-display text-lg font-bold text-ink">
            BioForja<span className="text-amber-brand">RC</span>
            {esAdminNav && (
              <Badge variant="warning" className="ml-2 align-middle">
                Admin
              </Badge>
            )}
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {enlaces.map((enlace) => (
            <NavLink key={enlace.to} to={enlace.to} end={enlace.end} className={enlaceClase}>
              {enlace.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">{acciones}</div>

        <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menú">
              <Menu className="size-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(20rem,90vw)] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Menú</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 px-3">
              {enlaces.map((enlace) => (
                <NavLink
                  key={enlace.to}
                  to={enlace.to}
                  end={enlace.end}
                  onClick={cerrarMenu}
                  className={(estado) => cn(enlaceClase(estado), 'block px-4 py-2.5 text-base')}
                >
                  {enlace.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-2 flex flex-col gap-2 border-t border-border p-5">
              {acciones}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
