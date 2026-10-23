import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { ScrollToTop } from './ScrollToTop'

export function AdminLayout() {
  const location = useLocation()

  return (
    <div className="d-flex min-vh-100 flex-column">
      <ScrollToTop />
      <Navbar variante="admin" />
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
