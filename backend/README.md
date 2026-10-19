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
- [ ] Fase 2 — `ms-catalogo` (8092).
- [ ] Fase 3 — `ms-envios` (8093).
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
