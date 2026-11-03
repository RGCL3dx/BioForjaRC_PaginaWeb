# Mapa de API y revisión manual — BioForjaRC

## 1. Convenciones

- El frontend consume exclusivamente el **API Gateway** en `http://localhost:8090`.
- La URL se configura con `VITE_API_URL`; ejemplo en `frontend/.env.example`.
- Todas las llamadas autenticadas envían `Authorization: Bearer <JWT>`.
- Los errores del backend usan `ErrorResponse` (`status`, `error`, `mensaje`, `detalles`).
- La autorización real se valida en cada microservicio; los guards de React no la sustituyen.

## 2. Contratos HTTP

### 2.1 Autenticación — `ms-usuarios`

| Método | Ruta | Propósito | Payload | Respuesta | Permisos | Pantalla / cliente |
|---|---|---|---|---|---|---|
| POST | `/api/auth/registro` | Registrar cliente | `RegistroRequest`: nombre, apellido, rut, correo, teléfono?, clave | `201 Usuario` | Público | `RegistroPage`, `authService.registrar` |
| POST | `/api/auth/login` | Iniciar sesión y obtener JWT | `{ correo, clave }` | `LoginResponse`: token, tipo, expiraEn, usuario | Público | `LoginPage`, `AuthContext`, `authService.login` |
| GET | `/api/auth/confirmar?token=` | Confirmar correo | `token` | `MensajeResponse` | Público | `authService.confirmar`; sin pantalla dedicada en la SPA |

### 2.2 Usuarios y direcciones — `ms-usuarios`

| Método | Ruta | Propósito | Payload | Respuesta | Permisos | Pantalla / cliente |
|---|---|---|---|---|---|---|
| GET | `/api/usuarios?q=` | Listar y buscar cuentas | `q` opcional | `Usuario[]` | Administrador | `AdminUsuariosPage`, `AdminDashboardPage` |
| GET | `/api/usuarios/validar?correo=` | Validación interna para `ms-pedidos` | `correo` | `ValidacionUsuarioResponse` | Público (uso interno) | No consumido por el frontend |
| GET | `/api/usuarios/{id}` | Obtener perfil | `id` | `Usuario` | Dueño o administrador | `AuthContext` al refrescar sesión |
| PUT | `/api/usuarios/{id}` | Actualizar perfil o cuenta | `UsuarioActualizacionRequest` | `Usuario` | Dueño o administrador | `MiCuentaPage`, `AdminUsuariosPage` |
| PATCH | `/api/usuarios/{id}/estado` | Activar o desactivar cuenta | `{ estado: 'Activo' \| 'Inactivo' }` | `Usuario` | Administrador | `AdminUsuariosPage` |
| GET | `/api/usuarios/{id}/direcciones` | Listar direcciones | — | `Direccion[]` | Dueño o administrador | `MiCuentaPage` |
| POST | `/api/usuarios/{id}/direcciones` | Crear dirección | `DireccionRequest` | `201 Direccion` | Dueño o administrador | `MiCuentaPage` |
| PUT | `/api/usuarios/{id}/direcciones/{dir}` | Actualizar dirección | `DireccionRequest` | `Direccion` | Dueño o administrador | `MiCuentaPage` |
| DELETE | `/api/usuarios/{id}/direcciones/{dir}` | Eliminar dirección | — | `204` | Dueño o administrador | `MiCuentaPage` |
| PATCH | `/api/usuarios/{id}/direcciones/{dir}/principal` | Marcar dirección principal | — | `Direccion` | Dueño o administrador | `MiCuentaPage` |

### 2.3 Catálogo e inventario — `ms-catalogo`

| Método | Ruta | Propósito | Payload | Respuesta | Permisos | Pantalla / cliente |
|---|---|---|---|---|---|---|
| GET | `/api/categorias` | Listar categorías | — | `Categoria[]` | Público | `HomePage`, `ProductosPage`, `AdminInventarioPage` |
| GET | `/api/productos?q=&categorias=&material=&pagina=&tamano=` | Catálogo paginado y filtrado | Query params | `PaginaResponse<ProductoResumen>` | Público (solo activos) | `HomePage`, `ProductosPage` |
| GET | `/api/productos/{id}` | Detalle de producto activo | `id` | `ProductoDetalle` | Público (solo activo) | `ProductoDetallePage`, revalidación en `CheckoutPage` |
| GET | `/api/productos/{id}/validar?cantidad=` | Validación interna de stock | `id`, `cantidad` | `ValidacionProductoResponse` | Público (uso interno) | No consumido por el frontend; lo usa `ms-pedidos` |
| GET | `/api/productos/inventario?q=&categorias=&activo=&pagina=&tamano=` | Inventario completo | Query params | `PaginaResponse<ProductoResumen>` | Administrador | `AdminInventarioPage` |
| GET | `/api/productos/inventario/resumen` | Resumen de inventario | — | `ResumenInventario` | Administrador | `AdminDashboardPage` |
| GET | `/api/productos/inventario/{id}` | Detalle para edición | `id` | `ProductoDetalle` | Administrador | `AdminInventarioPage` |
| POST | `/api/productos` | Crear producto | `ProductoRequest` | `201 ProductoDetalle` | Administrador | `AdminInventarioPage` |
| PUT | `/api/productos/{id}` | Actualizar producto | `ProductoRequest` | `ProductoDetalle` | Administrador | `AdminInventarioPage` |
| PATCH | `/api/productos/{id}/estado` | Alta o baja lógica | `{ activo: boolean }` | `ProductoDetalle` | Administrador | `AdminInventarioPage` |

### 2.4 Envíos — `ms-envios`

| Método | Ruta | Propósito | Payload | Respuesta | Permisos | Pantalla / cliente |
|---|---|---|---|---|---|---|
| GET | `/api/envios/regiones` | Regiones con sus comunas | — | `Region[]` | Público | `CheckoutPage` |
| GET | `/api/envios/regiones/{codigo}` | Obtener una región | `codigo` | `Region` | Público | Servicio disponible; no usado directamente |
| GET | `/api/envios/regiones/{codigo}/comunas` | Comunas de una región | `codigo` | `Comuna[]` | Público | Servicio disponible; el checkout usa las comunas incluidas en `/regiones` |
| GET | `/api/envios/metodos-despacho` | Métodos de despacho | — | `MetodoDespacho[]` | Público | `CheckoutPage` |
| POST | `/api/envios/cotizar` | Cotizar un método concreto | `CotizacionEnvioRequest` | `CotizacionEnvioResponse` | Público | Servicio disponible; el checkout usa `/opciones` |
| GET | `/api/envios/opciones?regionCodigo=&comuna=&subtotal=` | Opciones y costos autoritativos | Query params | `OpcionesEnvio` | Público | `CheckoutPage` |

### 2.5 Pedidos y reportes — `ms-pedidos`

| Método | Ruta | Propósito | Payload | Respuesta | Permisos | Pantalla / cliente |
|---|---|---|---|---|---|---|
| POST | `/api/pedidos` | Crear pedido desde checkout | `CrearPedidoRequest` | `PedidoDetalle` | Autenticado | `CheckoutPage` |
| GET | `/api/pedidos/mios` | Historial del cliente | — | `PedidoResumen[]` | Autenticado | `MiCuentaPage` |
| GET | `/api/pedidos?q=&estado=&desde=&hasta=&pagina=&tamano=` | Listado administrativo | Query params | `PaginaResponse<PedidoResumen>` | Administrador | `AdminPedidosPage` |
| GET | `/api/pedidos/{id}` | Detalle de pedido | `id` | `PedidoDetalle` | Dueño o administrador | `PedidoDetallePage`, `AdminPedidosPage` |
| PATCH | `/api/pedidos/{id}/estado` | Cambiar estado de despacho | `{ estado }` | `PedidoDetalle` | Administrador | `AdminPedidosPage` |
| GET | `/api/pedidos/{id}/comprobante` | Descargar comprobante PDF | `id` | `application/pdf` | Dueño o administrador | `PedidoDetallePage`, `MiCuentaPage`, `AdminPedidosPage` |
| GET | `/api/reportes/ventas?desde=&hasta=` | Reporte de ventas | Query params | `ReporteVentas` | Administrador | `AdminDashboardPage` |
| GET | `/api/reportes/ventas/exportar?desde=&hasta=&formato=` | Exportar reporte | `formato=xlsx\|pdf` | Archivo Excel/PDF | Administrador | `AdminDashboardPage` |

### 2.6 Cotizaciones — `ms-cotizaciones`

| Método | Ruta | Propósito | Payload | Respuesta | Permisos | Pantalla / cliente |
|---|---|---|---|---|---|---|
| POST | `/api/cotizaciones` | Crear solicitud con adjuntos | `multipart/form-data`: nombre, apellido, correo, teléfono?, categoría, cantidad?, plazo?, descripción, `archivos[]` | `201 CotizacionDetalle` | Público | `CotizacionPage` |
| GET | `/api/cotizaciones?q=&estado=&desde=&hasta=&pagina=&tamano=` | Listado administrativo | Query params | `PaginaResponse<CotizacionResumen>` | Administrador | `AdminCotizacionesPage`, `AdminDashboardPage` |
| GET | `/api/cotizaciones/{id}` | Detalle de cotización | `id` | `CotizacionDetalle` | Administrador | `AdminCotizacionesPage` |
| GET | `/api/cotizaciones/archivos/{archivoId}` | Descargar archivo 3D | `archivoId` | Archivo con `Content-Disposition` | Administrador | `AdminCotizacionesPage` |
| POST | `/api/cotizaciones/{id}/presupuesto` | Asignar monto y plazo | `PresupuestoRequest`: montoTotal, plazoEntregaDias, observaciones? | `CotizacionDetalle` | Administrador | `AdminCotizacionesPage` |

### 2.7 Consultas — `ms-consultas`

| Método | Ruta | Propósito | Payload | Respuesta | Permisos | Pantalla / cliente |
|---|---|---|---|---|---|---|
| POST | `/api/consultas` | Registrar consulta de contacto | `ConsultaRequest`: nombre, correo, teléfono?, asunto, mensaje | `201 ConsultaResponse` | Público | `ContactoPage` |

## 3. Verbos HTTP utilizados y justificación

| Verbo | Uso real en BioForjaRC |
|---|---|
| GET | Consultas de catálogo, perfiles, pedidos, reportes, cotizaciones, envíos y descargas |
| POST | Registro, login, creación de pedidos, cotizaciones, consultas, direcciones y presupuesto |
| PUT | Actualización completa de perfil, dirección y producto |
| PATCH | Cambios de estado de usuario, producto y pedido; dirección principal |
| DELETE | Solo direcciones del usuario |

No se fuerza DELETE en pedidos, productos, usuarios ni cotizaciones porque el dominio usa baja lógica o
conserva historial. No se añadieron métodos artificiales para “completar un CRUD”.

## 4. Flujos conectados realmente

| Flujo | Servicios | Pantalla | Estado de conexión |
|---|---|---|---|
| Catálogo y detalle | `ms-catalogo` | `HomePage`, `ProductosPage`, `ProductoDetallePage` | Conectado por código; no ejecutado en vivo en esta entrega |
| Registro y login | `ms-usuarios` | `RegistroPage`, `LoginPage`, `AuthContext` | Conectado por código; no ejecutado en vivo |
| Perfil y direcciones | `ms-usuarios` | `MiCuentaPage` | Conectado por código; no ejecutado en vivo |
| Carrito | Estado local | `CartContext`, `CarritoPage` | Verificado por inspección y build |
| Checkout y pedido | `ms-envios`, `ms-catalogo`, `ms-pedidos` | `CheckoutPage`, `PedidoDetallePage` | Conectado por código; no ejecutado en vivo |
| Cotización con archivos | `ms-cotizaciones` | `CotizacionPage`, `AdminCotizacionesPage` | Conectado por código; no ejecutado en vivo |
| Contacto | `ms-consultas` | `ContactoPage` | Conectado por código; no ejecutado en vivo |
| Panel y reportes | `ms-pedidos`, `ms-catalogo`, `ms-usuarios`, `ms-cotizaciones` | `AdminDashboardPage` | Conectado por código; no ejecutado en vivo |
| Administración de pedidos | `ms-pedidos` | `AdminPedidosPage` | Conectado por código; no ejecutado en vivo |
| Administración de usuarios | `ms-usuarios` | `AdminUsuariosPage` | Conectado por código; no ejecutado en vivo |
| Administración de inventario | `ms-catalogo` | `AdminInventarioPage` | Conectado por código; no ejecutado en vivo |

## 5. Verificación manual

### 5.1 Verificado

- `npm run build`: TypeScript estricto y build de Vite correctos.
- `npm run lint`: sin errores.
- `.\mvnw.cmd -DskipTests package`: correcto en `api-gateway`, `ms-usuarios`, `ms-catalogo`,
  `ms-pedidos`, `ms-envios`, `ms-cotizaciones` y `ms-consultas`.
- Búsqueda de imports y clases Bootstrap en `frontend/`: sin coincidencias.
- Revisión de rutas en `frontend/src/App.tsx`: todas las pantallas solicitadas están registradas.
- Revisión de servicios HTTP: todas las operaciones anteriores tienen cliente tipado.
- Renderizado en navegador integrado (Chromium) con `npm run dev`: inicio, productos, cotización,
  contacto, nosotros, login y carrito. `/admin` redirige a `/login` sin sesión.
- Navegación responsiva básica a 800 px: el botón “Abrir menú” despliega el panel lateral.
- Estados de error sin backend: las páginas muestran una alerta controlada en lugar de romperse.

### 5.2 No verificado

- Ejecución real de los flujos contra PostgreSQL y los servicios activos.
- Persistencia tras reiniciar el backend.
- Respuestas 401, 403, 404, 409 y 400 en vivo.
- Envío real de correos.
- Pago real.
- Descuento de stock.
- Revisión en dispositivos móviles físicos y validación de todos los flujos con los servicios activos.

La revisión manual en vivo no se declara como completada. No se sustituye por pruebas unitarias ni por
un porcentaje de cobertura.

## 6. Limitaciones conocidas

- El pago es simulado; no hay pasarela comercial.
- Los correos se registran en el log local.
- El stock se valida, pero no se descuenta automáticamente.
- El enlace de pago de cotizaciones es informativo.
- No hay SMTP configurado.
- No hay pruebas unitarias ni cobertura en esta fase.
