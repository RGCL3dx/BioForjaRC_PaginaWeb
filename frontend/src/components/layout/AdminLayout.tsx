import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { ScrollToTop } from './ScrollToTop'

export function AdminLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar variante="admin" />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="mt-auto border-t border-white/10 bg-brand-dark py-3 text-white">
        <div className="container-page flex flex-wrap justify-between gap-2 text-xs text-white/60">
          <span>Panel de administración BioForjaRC</span>
          <span>{location.pathname}</span>
        </div>
      </footer>
    </div>
  )
}
