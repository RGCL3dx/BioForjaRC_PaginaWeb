# Frontend BioForjaRC

Cliente web en **React 19 + TypeScript + Vite + Tailwind CSS v4** con componentes estilo
**shadcn/ui** (Radix UI + CVA). Consume exclusivamente el API Gateway de BioForjaRC en
`http://localhost:8090`.

> **Nota académica:** la evaluación menciona Bootstrap, pero el usuario solicitó Tailwind CSS y
> shadcn/ui. Bootstrap fue retirado de esta aplicación. Es una **equivalencia tecnológica pendiente de
> validar con el docente**; no se afirma cumplimiento literal de Bootstrap.

## Requisitos

- Node.js 22 o superior (verificado con v25.7.0)
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
| `npm run lint` | Análisis estático con Oxlint |

Los scripts `npm test` y `npm run test:watch` fueron retirados junto con las pruebas unitarias por
solicitud del usuario. No hay framework de pruebas unitarias instalado.

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

```text
src/
├── components/
│   ├── ui/          Primitivas estilo shadcn/ui (Button, Card, Dialog, Table, etc.)
│   ├── common/      Componentes de negocio reutilizables
│   ├── catalog/     ProductCard, ProductList
│   └── layout/      Navbar, Layout, AdminLayout, Guards
├── context/         Auth, Cart y Notification
├── pages/           Páginas públicas, de cuenta y administración
├── services/        Cliente HTTP por dominio
├── types/           Contratos TypeScript
├── utils/           Formato de moneda, fechas y números
├── lib/             Utilidad `cn`
└── styles/base/     Tokens Tailwind y estilos globales
```

- `src/services/http.ts`: URL base, JWT, manejo de errores, sesión expirada y descargas.
- `src/services/`: un cliente por dominio del backend.
- `src/context/`: autenticación, carrito y notificaciones.
- `src/components/ui/`: base visual; la lógica de negocio permanece en componentes y páginas.
- `src/types/api.ts`: contratos TypeScript de respuestas y solicitudes.
- `src/utils/format.ts`: formato CLP, fechas, números y rutas de imágenes.

### Configuración de Tailwind y shadcn/ui

- `components.json`: configuración de shadcn/ui.
- `vite.config.ts`: plugins de React y `@tailwindcss/vite`, alias `@` a `src`.
- `tsconfig.app.json`: alias `@/*`.
- `src/lib/utils.ts`: función `cn`.
- `src/styles/base/global.css`: `@import 'tailwindcss'`, variables de tema, tokens de marca
  BioForjaRC y utilidades compartidas.

La carpeta original `paginas/`, `js/`, `css/` y `assets/` no se modifica; el sitio estático conserva
sus propios estilos.

## Verificación

Estado de esta entrega:

- `npm run build`: correcto (TypeScript estricto + Vite).
- `npm run lint`: sin errores.
- Pruebas unitarias: retiradas por solicitud; no ejecutadas.
- Cobertura: no generada.
- Rutas públicas revisadas en navegador integrado (Chromium): inicio, productos, cotización,
  contacto, nosotros, login y carrito renderizan. `/admin` redirige a `/login` sin sesión.
- Navegación responsiva básica a 800 px: el botón de menú abre el panel lateral con los enlaces.
- Flujo E2E con servicios activos: no verificado; los puertos 8090–8096 estaban libres durante la revisión.
- Revisión en dispositivos móviles reales: pendiente.

No se presentan resultados históricos de Vitest como validación actual. Ver
[`../docs/Mapa_API.md`](../docs/Mapa_API.md) y [`../docs/Retiro_Pruebas_Unitarias.md`](../docs/Retiro_Pruebas_Unitarias.md).

## Pendientes conocidos

- Pasarela de pago real: el pago es simulado.
- Envío real de correos: los mensajes se registran en el log.
- Descuento automático de stock al crear un pedido: el backend valida stock, pero no lo descuenta.
- Página transaccional real para pagar cotizaciones: el enlace actual informa cómo coordinar el pago.
- Pruebas unitarias y cobertura: aplazadas para una fase posterior.
- Validación docente de Tailwind/shadcn/ui como equivalencia de Bootstrap.
