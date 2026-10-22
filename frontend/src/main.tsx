import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './styles/base/global.css'
import './styles/base/estructura.css'
import './styles/paginas/portada.css'
import './styles/paginas/productos.css'
import './styles/paginas/carrito.css'
import './styles/paginas/checkout.css'
import './styles/paginas/login.css'
import './styles/paginas/registro.css'
import './styles/paginas/mi-cuenta.css'
import './styles/paginas/cotizacion.css'
import './styles/paginas/contacto.css'
import './styles/paginas/nosotros.css'
import './styles/paginas/boleta.css'
import './styles/paginas/resumen-flotante.css'
import './styles/paginas/admin/panel.css'
import './styles/paginas/admin/inventario.css'
import './styles/paginas/admin/pedidos.css'
import './styles/paginas/admin/usuarios.css'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { NotificationProvider } from './context/NotificationContext'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  </StrictMode>,
)
