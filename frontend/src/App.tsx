import { Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/layout/AdminLayout'
import { RequireAdmin, RequireAuth } from './components/layout/Guards'
import { Layout } from './components/layout/Layout'
import { AdminCotizacionesPage } from './pages/admin/AdminCotizacionesPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminInventarioPage } from './pages/admin/AdminInventarioPage'
import { AdminPedidosPage } from './pages/admin/AdminPedidosPage'
import { AdminUsuariosPage } from './pages/admin/AdminUsuariosPage'
import { CarritoPage } from './pages/CarritoPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { ContactoPage } from './pages/ContactoPage'
import { CotizacionPage } from './pages/CotizacionPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MiCuentaPage } from './pages/MiCuentaPage'
import { NosotrosPage } from './pages/NosotrosPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { PagoCotizacionPage } from './pages/PagoCotizacionPage'
import { PedidoDetallePage } from './pages/PedidoDetallePage'
import { ProductoDetallePage } from './pages/ProductoDetallePage'
import { ProductosPage } from './pages/ProductosPage'
import { RegistroPage } from './pages/RegistroPage'

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="productos" element={<ProductosPage />} />
        <Route path="productos/:id" element={<ProductoDetallePage />} />
        <Route path="carrito" element={<CarritoPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="registro" element={<RegistroPage />} />
        <Route path="nosotros" element={<NosotrosPage />} />
        <Route path="cotizacion" element={<CotizacionPage />} />
        <Route path="contacto" element={<ContactoPage />} />
        <Route path="pago-cotizacion" element={<PagoCotizacionPage />} />

        <Route element={<RequireAuth />}>
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="pedido/:id" element={<PedidoDetallePage />} />
          <Route path="mi-cuenta" element={<MiCuentaPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route element={<RequireAdmin />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="inventario" element={<AdminInventarioPage />} />
          <Route path="pedidos" element={<AdminPedidosPage />} />
          <Route path="usuarios" element={<AdminUsuariosPage />} />
          <Route path="cotizaciones" element={<AdminCotizacionesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
