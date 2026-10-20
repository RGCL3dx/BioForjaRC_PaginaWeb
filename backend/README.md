# Backend BioForjaRC — Microservicios

Arquitectura de microservicios con patrón **CRS** (Controller – Repository – Service).
Cada servicio de negocio tiene **su propia base de datos PostgreSQL** y **no** consulta
la base de datos de otro servicio.

## Puertos

| Servicio | Puerto | Requerimientos que cubre |
|---|---|---|
| `api-gateway` | 8090 | Punto único de entrada + CORS |
| `ms-usuarios` | 8091 | EP-02 (registro, login, administración de cuentas) |
| `ms-catalogo` | 8092 | EP-01 (catálogo) y EP-08 (productos y stock) |
| `ms-envios` | 8093 | EP-06 (zonas, tarifas y métodos de despacho) |
| `ms-pedidos` | 8094 | EP-03 (pedidos y pago) y EP-09 (historial y reportes) |
| `ms-cotizaciones` | 8095 | EP-04 (cotizaciones con archivos 3D) |
| `ms-consultas` | 8096 | EP-05 (mensajes de consulta) |

> Los puertos 8080 y 8082 **no** se usan en este equipo: el 8080 está ocupado por
> otro proceso Java ajeno al proyecto y el 8082 está excluido por Windows
> (rangos reservados de Hyper-V/WinNAT). Por eso el rango base es **8090-8096**.

## Requisitos

- JDK 25
- Maven Wrapper incluido en cada servicio (`mvnw.cmd` / `./mvnw`), no requiere Maven instalado
- PostgreSQL 18 local

## Cómo ejecutar un servicio

```powershell
cd backend\<servicio>
.\mvnw.cmd spring-boot:run
```

El frontend consume **únicamente** el API Gateway en `http://localhost:8090`.

## Estado de implementación

- [x] **Fase 0** — `api-gateway` (8090): rutas, CORS, timeouts y actuator.
- [x] **Fase 1** — `ms-usuarios` (8091): registro, login JWT, administración de cuentas y direcciones.
- [x] **Fase 2** — `ms-catalogo` (8092): catálogo, búsqueda, filtros, inventario y stock.
- [x] **Fase 3** — `ms-envios` (8093): regiones, comunas, métodos de despacho, tarifas y cotización.
- [x] **Fase 4** — `ms-pedidos` (8094): checkout, pago simulado, comprobante, historial y reportes.
- [x] **Fase 5** — `ms-cotizaciones` (8095): solicitudes con archivos 3D, presupuesto y enlace de pago.
- [ ] Fase 6 — `ms-consultas` (8096).
- [ ] Fase 7 — frontend React + TypeScript + Vite.

## ms-usuarios (EP-02)

Base de datos: `bioforja_usuarios` (PostgreSQL 18).
Pruebas: `bioforja_usuarios_test`.
Paquete base: `cl.bioforjarc.usuarios`.

### Variables de entorno

Ningún secreto se guarda en el repositorio. Antes de ejecutar:

```powershell
$env:BIOFORJA_DB_HOST="localhost"
$env:BIOFORJA_DB_PORT="5432"
$env:BIOFORJA_DB_NAME="bioforja_usuarios"
$env:BIOFORJA_DB_USERNAME="bioforja"
$env:BIOFORJA_DB_PASSWORD="<clave-local>"
$env:BIOFORJA_JWT_SECRET="<secreto-de-al-menos-32-caracteres>"
```

Variables opcionales: `BIOFORJA_DB_TEST_NAME`, `BIOFORJA_JWT_EXPIRACION_SEGUNDOS`,
`BIOFORJA_SEMILLA_HABILITADA`, `BIOFORJA_CORREO_REMITENTE`, `BIOFORJA_URL_BASE`.

### Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/registro` | Público |
| POST | `/api/auth/login` | Público (devuelve JWT) |
| GET | `/api/auth/confirmar?token=` | Público |
| GET | `/api/usuarios?q=` | Administrador |
| GET | `/api/usuarios/{id}` | Dueño o administrador |
| GET | `/api/usuarios/validar?correo=` | Público (uso interno de ms-pedidos) |
| PUT | `/api/usuarios/{id}` | Dueño o administrador |
| PATCH | `/api/usuarios/{id}/estado` | Administrador |
| GET/POST | `/api/usuarios/{id}/direcciones` | Dueño o administrador |
| PUT/DELETE | `/api/usuarios/{id}/direcciones/{dir}` | Dueño o administrador |
| PATCH | `/api/usuarios/{id}/direcciones/{dir}/principal` | Dueño o administrador |

La contraseña se almacena con BCrypt y nunca se devuelve en las respuestas.
El enlace de confirmación se escribe en el log en entorno local; el envío SMTP
real queda pendiente de configurar credenciales de correo.

### Ejecutar y probar

```powershell
cd backend\ms-usuarios
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

Cuentas semilla (solo si `BIOFORJA_SEMILLA_HABILITADA=true`):

- `admin@bioforjarc.cl` / `Admin123` (administrador)
- `hermenegildo.gonzalez@correo.cl` / `Clave1234` (cliente)

## ms-catalogo (EP-01 y EP-08)

Base de datos: `bioforja_catalogo` (PostgreSQL 18).
Pruebas: `bioforja_catalogo_test`.
Paquete base: `cl.bioforjarc.catalogo`.

### Variables de entorno

Comparte las credenciales de PostgreSQL y el secreto JWT con `ms-usuarios`:

```powershell
$env:BIOFORJA_DB_HOST="localhost"
$env:BIOFORJA_DB_PORT="5432"
$env:BIOFORJA_CATALOGO_DB_NAME="bioforja_catalogo"
$env:BIOFORJA_DB_USERNAME="bioforja"
$env:BIOFORJA_DB_PASSWORD="<clave-local>"
$env:BIOFORJA_JWT_SECRET="<mismo-secreto-que-ms-usuarios>"
```

Variables opcionales: `BIOFORJA_CATALOGO_TEST_DB_NAME`, `BIOFORJA_SEMILLA_HABILITADA`.

### Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/categorias` | Público |
| GET | `/api/productos?q=&categorias=&material=&pagina=&tamano=` | Público (solo activos) |
| GET | `/api/productos/{id}` | Público (solo activo) |
| GET | `/api/productos/{id}/validar?cantidad=` | Público (uso interno de ms-pedidos) |
| GET | `/api/productos/inventario` | Administrador |
| GET | `/api/productos/inventario/resumen` | Administrador |
| GET | `/api/productos/inventario/{id}` | Administrador |
| POST | `/api/productos` | Administrador |
| PUT | `/api/productos/{id}` | Administrador |
| PATCH | `/api/productos/{id}/estado` | Administrador |

La baja de productos es lógica (`activo = false`); nunca se eliminan.
El stock bajo se informa con `stockBajo = true` cuando hay menos de 5 unidades.
La semilla carga las 4 categorías y los 18 productos que ya muestra el sitio.

### Ejecutar y probar

```powershell
cd backend\ms-catalogo
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

## ms-envios (EP-06)

Base de datos: `bioforja_envios` (PostgreSQL 18).
Pruebas: `bioforja_envios_test`.
Paquete base: `cl.bioforjarc.envios`.

### Variables de entorno

```powershell
$env:BIOFORJA_DB_HOST="localhost"
$env:BIOFORJA_DB_PORT="5432"
$env:BIOFORJA_ENVIOS_DB_NAME="bioforja_envios"
$env:BIOFORJA_DB_USERNAME="bioforja"
$env:BIOFORJA_DB_PASSWORD="<clave-local>"
```

Variables opcionales: `BIOFORJA_ENVIOS_TEST_DB_NAME`, `BIOFORJA_SEMILLA_HABILITADA`.

### Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| GET | `/api/envios/regiones` | Público |
| GET | `/api/envios/regiones/{codigo}` | Público |
| GET | `/api/envios/regiones/{codigo}/comunas` | Público |
| GET | `/api/envios/metodos-despacho` | Público |
| POST | `/api/envios/cotizar` | Público |
| GET | `/api/envios/opciones?regionCodigo=&comuna=&subtotal=` | Público |

La cotización recibe `regionCodigo`, `comuna`, `metodoCodigo` y `subtotal`.
La región puede reemplazarse por la comuna cuando su nombre es único.
El retiro presencial no exige región y siempre cuesta $0.

La semilla carga 16 regiones, 69 comunas, los métodos `estandar`,
`express` y `retiro`, y 40 tarifas referenciales (32 regionales y 8
excepciones por comuna). Para la Región Metropolitana el estándar cuesta
$3.500 y el express $6.500, manteniendo los valores actuales del checkout.
Se conservan los códigos antiguos `libgral`, `bio` y `araycan` como alias.

Todas las rutas son públicas en esta fase porque las HU-06.1 y HU-06.2 son
de usuario. No se agregaron endpoints administrativos que la plantilla no exige.

### Ejecutar y probar

```powershell
cd backend\ms-envios
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

## ms-pedidos (EP-03 y EP-09)

Base de datos: `bioforja_pedidos` (PostgreSQL 18).
Pruebas: `bioforja_pedidos_test`.
Paquete base: `cl.bioforjarc.pedidos`.

Cubre HU-03.1 (datos de facturación y despacho), HU-03.2 (pago y comprobante
con número de orden) y HU-09.1 (historial del cliente y reporte comercial).
No descuenta stock: la validación de producto y stock es de `ms-catalogo`, y
el ajuste de inventario queda pendiente de una fase posterior.

### Variables de entorno

```powershell
$env:BIOFORJA_DB_HOST="localhost"
$env:BIOFORJA_DB_PORT="5432"
$env:BIOFORJA_PEDIDOS_DB_NAME="bioforja_pedidos"
$env:BIOFORJA_DB_USERNAME="bioforja"
$env:BIOFORJA_DB_PASSWORD="<clave-local>"
$env:BIOFORJA_JWT_SECRET="<mismo-secreto-que-ms-usuarios>"
```

Variables opcionales: `BIOFORJA_PEDIDOS_TEST_DB_NAME`,
`BIOFORJA_JWT_EMISOR`, `BIOFORJA_USUARIOS_URL` (8091),
`BIOFORJA_CATALOGO_URL` (8092) y `BIOFORJA_ENVIOS_URL` (8093).

### Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/pedidos` | Cliente o administrador autenticado |
| GET | `/api/pedidos/mios` | Cliente autenticado (historial propio) |
| GET | `/api/pedidos/{id}` | Dueño o administrador |
| GET | `/api/pedidos/{id}/comprobante` | Dueño o administrador (PDF) |
| GET | `/api/pedidos?q=&estado=&desde=&hasta=&pagina=&tamano=` | Administrador |
| PATCH | `/api/pedidos/{id}/estado` | Administrador |
| GET | `/api/reportes/ventas?desde=&hasta=` | Administrador |
| GET | `/api/reportes/ventas/exportar?desde=&hasta=&formato=xlsx\|pdf` | Administrador |

El checkout exige nombre, apellido, Boleta o Factura y método de pago; para
envío a domicilio también dirección, comuna y región. El correo del comprador
se toma del JWT y nunca del cuerpo. El estado inicial es `En preparación` y los
demás estados son `Despachado`, `Entregado` y `Cancelado`.

El pago es **simulado** (`pagoSimulado = true`): se registra método, referencia
y fecha de pago, se emite el número de orden `BF-AAAAMMDD-XXXXXX` y se genera
el comprobante PDF. La pasarela real queda pendiente por decisión académica.

El reporte entrega total de ventas, ticket promedio, cantidad de pedidos,
unidades vendidas, ingresos diarios y mensuales, y Top 5 de productos. Solo
considera pedidos pagados y no cancelados.

### Ejecutar y probar

```powershell
cd backend\ms-pedidos
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

## ms-cotizaciones (EP-04)

Base de datos: `bioforja_cotizaciones` (PostgreSQL 18).
Pruebas: `bioforja_cotizaciones_test`.
Paquete base: `cl.bioforjarc.cotizaciones`.

Cubre HU-04.1 (formulario público con archivos 3D y ticket en estado
`Pendiente`), HU-04.2 (descarga del archivo y detalle de especificaciones por
el administrador) y HU-04.3 (monto, plazo de entrega y envío del enlace de pago).
No se adelantó la aprobación o el pago de la cotización: solo se generan los
datos que exige la plantilla.

### Variables de entorno

```powershell
$env:BIOFORJA_DB_HOST="localhost"
$env:BIOFORJA_DB_PORT="5432"
$env:BIOFORJA_COTIZACIONES_DB_NAME="bioforja_cotizaciones"
$env:BIOFORJA_DB_USERNAME="bioforja"
$env:BIOFORJA_DB_PASSWORD="<clave-local>"
$env:BIOFORJA_JWT_SECRET="<mismo-secreto-que-ms-usuarios>"
```

Variables opcionales:

- `BIOFORJA_COTIZACIONES_TEST_DB_NAME` (por defecto `bioforja_cotizaciones_test`).
- `BIOFORJA_ARCHIVOS_DIRECTORIO` (por defecto `%USERPROFILE%\.bioforjarc\cotizaciones-archivos`).
- `BIOFORJA_ARCHIVOS_MAX` (por defecto `5` archivos por solicitud).
- `BIOFORJA_ARCHIVOS_TAMANO_MAX` (por defecto `52428800` bytes = 50 MB por archivo).
- `BIOFORJA_PAGO_URL_BASE` (por defecto `http://localhost:5173/pago-cotizacion`).
- `BIOFORJA_CORREO_REMITENTE` (por defecto `no-reply@bioforjarc.cl`).

Los archivos 3D se guardan **fuera del repositorio** y nunca se versionan en
Git. La base de datos solo conserva la ruta relativa y los metadatos.

### Endpoints

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/cotizaciones` | Público (`multipart/form-data`) |
| GET | `/api/cotizaciones?q=&estado=&desde=&hasta=&pagina=&tamano=` | Administrador |
| GET | `/api/cotizaciones/{id}` | Administrador |
| GET | `/api/cotizaciones/archivos/{archivoId}` | Administrador (descarga) |
| POST | `/api/cotizaciones/{id}/presupuesto` | Administrador |

El formulario acepta `nombre`, `apellido`, `correo`, `telefono`, `categoria`,
`cantidad`, `plazo`, `descripcion` y uno o más archivos en el campo
`archivos`. Solo se aceptan `.STL` y `.OBJ` de hasta 50 MB cada uno; la
cantidad máxima de archivos es configurable (5 por defecto). El ticket se
genera con el formato `COT-AAAAMMDD-XXXXXX` y nace en estado `Pendiente`.

Al presupuestar se guardan `montoTotal`, `plazoEntregaDias` y
`observaciones`, el estado pasa a `Presupuestada` y se genera un enlace
`.../pago-cotizacion?ticket=COT-...`. En este entorno no hay SMTP: el correo
con el presupuesto y el enlace se escribe en el log mediante
`CorreoConsolaServiceImpl`; la interfaz permite sustituirlo por un adaptador
SMTP real sin cambiar el servicio.

La descarga responde con `Content-Disposition: attachment` y el nombre
original del archivo. El frontend actual (`paginas/cotizacion.html`) todavía
no tiene `input type="file"` ni consume estos endpoints; su migración a React
queda para la Fase 7, sin modificar el sitio estático en esta fase.

### Ejecutar y probar

```powershell
cd backend\ms-cotizaciones
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

Pruebas: 25 en total (9 de integración con MockMvc, 7 unitarias del servicio,
8 del almacenamiento de archivos y 1 de contexto). El E2E por el gateway
verificó creación pública con dos archivos, listado y detalle administrativo,
descarga autenticada, presupuesto con enlace y correo simulado, filtros,
401/403/400/404, límite de extensión y CORS.
