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
- [x] Fase 3 — `ms-envios` (8093).
- [ ] Fase 4 — `ms-pedidos` (8094).
- [ ] Fase 5 — `ms-cotizaciones` (8095).
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
