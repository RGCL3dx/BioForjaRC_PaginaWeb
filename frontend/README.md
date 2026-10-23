# Frontend BioForjaRC

Cliente web en **React 19 + TypeScript + Vite + SWC + Bootstrap 5** que consume exclusivamente el API Gateway de BioForjaRC en `http://localhost:8090`.

## Requisitos

- Node.js 22 o superior
- API Gateway y microservicios iniciados (`8090` a `8096`)
- PostgreSQL 18 con las bases de datos del backend

## Configuración

1. Copia `.env.example` a `.env` (o define la variable en el entorno):

   ```powershell
   VITE_API_URL=http://localhost:8090
   ```

2. Instala dependencias:

   ```powershell
   cd frontend
   npm install
   ```

3. Inicia el servidor de desarrollo:

   ```powershell
   npm run dev
   ```

   La aplicación queda disponible en `http://localhost:5173`.

No guardes credenciales, tokens ni secretos en `.env` ni en el repositorio.

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Verificación TypeScript y build de producción en `dist/` |
| `npm run preview` | Vista previa del build de producción |
| `npm run lint` | Análisis estático con ESLint |
| `npm test` | Pruebas unitarias con Vitest |
| `npm run test:watch` | Pruebas en modo interactivo |

## Rutas principales

### Públicas

- `/` — inicio
- `/productos` — catálogo, búsqueda, filtros y paginación
- `/productos/:id` — detalle de producto
- `/nosotros` — información del proyecto
- `/contacto` — formulario de consultas
- `/cotizacion` — solicitud con archivos `.STL` / `.OBJ`
- `/pago-cotizacion?ticket=...` — información del pago de una cotización
- `/login`, `/registro` — autenticación
- `/carrito` — carrito local

### Cliente autenticado

- `/checkout` — datos de compra, despacho, documento y pago simulado
- `/pedido/:id` — detalle y comprobante del pedido
- `/mi-cuenta` — datos personales, direcciones e historial de pedidos

### Administrador

- `/admin` — panel, reportes y exportaciones Excel/PDF
- `/admin/inventario` — alta, edición, activación y desactivación de productos
- `/admin/pedidos` — pedidos, cambio de estado y comprobantes
- `/admin/usuarios` — datos, roles y estado de las cuentas
- `/admin/cotizaciones` — detalle, descarga de archivos 3D y presupuesto

## Arquitectura

- `src/services/http.ts`: cliente HTTP, JWT, manejo de errores, descargas y URL del Gateway.
- `src/services/`: un servicio por dominio del backend.
- `src/context/`: autenticación, carrito, notificaciones y catálogo.
- `src/components/`: layouts, guards y componentes reutilizables (`Navbar`, `ProductList`, `ProductCard`, `ConfirmModal`, etc.).
- `src/pages/`: páginas públicas, de cuenta y de administración.
- `src/types/api.ts`: contratos TypeScript de las respuestas y solicitudes.
- `src/utils/format.ts`: formato de moneda, fechas, números y rutas de imágenes.

El diseño y los estilos se reutilizan del sitio original copiado a `public/assets` y `src/styles`; las carpetas originales `paginas/`, `js/`, `css/` y `assets/` no se modifican.

## Verificación

Estado de la última ejecución:

- `npm run lint`: sin errores.
- `npm test`: 11 archivos y 42 pruebas aprobadas.
- `npm run build`: correcto.
- Trazabilidad HU/CA: [`../docs/Matriz_Pruebas_Frontend.md`](../docs/Matriz_Pruebas_Frontend.md).
- Flujo probado en navegador real: catálogo, búsqueda, filtros, registro, login, perfil, direcciones, carrito, checkout con boleta/factura, retiro, envío estándar/express, pago simulado, comprobantes, cotizaciones con archivos, presupuesto y panel administrativo.
- Permisos y errores probados: rutas protegidas, cliente en `/admin`, 401, 403, 404, sesión expirada, credenciales inválidas, correo duplicado, stock insuficiente y Gateway caído.
- Responsive revisado a 375 px, 768 px y escritorio.

## Pendientes conocidos

- Pasarela de pago real: el pago es simulado.
- Envío real de correos: los mensajes se registran en el log.
- Descuento automático de stock al crear un pedido: el backend valida stock, pero no lo descuenta.
- Página transaccional real para pagar cotizaciones: el enlace actual informa cómo coordinar el pago.
