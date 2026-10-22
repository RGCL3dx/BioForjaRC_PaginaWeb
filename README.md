# BioForjaRC

Tienda y catálogo de productos sostenibles impresos en 3D a partir de plástico PET reciclado.

El proyecto combina un sitio estático original con una aplicación React y una arquitectura de microservicios:

- `frontend/`: React 19 + TypeScript + Vite. Consume únicamente el API Gateway.
- `backend/`: siete servicios Spring Boot 4.1.1 con Java 25 y PostgreSQL 18.
- `paginas/`, `js/`, `css/`, `assets/`: sitio estático original, conservado sin cambios.

## Arquitectura

```text
frontend (5173)
      |
      v
api-gateway (8090)
      |
      +-- ms-usuarios (8091)       bioforja_usuarios
      +-- ms-catalogo (8092)       bioforja_catalogo
      +-- ms-envios (8093)         bioforja_envios
      +-- ms-pedidos (8094)        bioforja_pedidos
      +-- ms-cotizaciones (8095)   bioforja_cotizaciones
      +-- ms-consultas (8096)      bioforja_consultas
```

Cada microservicio tiene su propia base de datos y no consulta la base de otro servicio. La comunicación es REST síncrona a través del Gateway, con JWT, validaciones, manejo global de errores y timeouts.

## Requisitos

- JDK 25
- PostgreSQL 18
- Node.js 22 o superior

## Puesta en marcha

### 1. Base de datos y variables del backend

Crea las bases de datos de los servicios y define las variables de entorno. Los secretos no se guardan en el repositorio.

```powershell
$env:BIOFORJA_DB_HOST="localhost"
$env:BIOFORJA_DB_PORT="5432"
$env:BIOFORJA_DB_USERNAME="bioforja"
$env:BIOFORJA_DB_PASSWORD="<clave-local>"
$env:BIOFORJA_JWT_SECRET="<secreto-de-al-menos-32-caracteres>"
```

Para crear las cuentas semilla en una base nueva:

```powershell
$env:BIOFORJA_SEMILLA_HABILITADA="true"
$env:BIOFORJA_SEMILLA_ADMIN_CLAVE="<clave-local-admin>"
$env:BIOFORJA_SEMILLA_CLIENTE_CLAVE="<clave-local-cliente>"
```

### 2. Backend

En una terminal por servicio:

```powershell
cd backend\<servicio>
.\mvnw.cmd spring-boot:run
```

Los servicios deben quedar activos en los puertos `8090` a `8096`. El detalle de variables, endpoints y pruebas está en [`backend/README.md`](backend/README.md).

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173` y consume el Gateway en `http://localhost:8090`. Instrucciones completas, rutas y scripts en [`frontend/README.md`](frontend/README.md).

## Verificación

- Frontend: `npm run lint` sin errores, 19 pruebas Vitest aprobadas y build de producción correcto.
- Backend: 121 pruebas Maven aprobadas en los siete servicios.
- Flujo E2E por el Gateway: catálogo, registro, login, perfil, direcciones, carrito, checkout con boleta/factura, retiro y envíos, pago simulado, comprobantes, cotizaciones con archivos 3D, presupuesto, panel administrativo, reportes, permisos 401/403, 404, validaciones, stock insuficiente y Gateway caído.
- Responsive revisado a 375 px, 768 px y escritorio.

## Alcance y pendientes

- El pago es simulado; no se integra una pasarela real.
- Los correos se escriben en el log; no hay SMTP real.
- El backend valida stock al crear un pedido, pero todavía no lo descuenta.
- El enlace de pago de cotizaciones es informativo; no existe una pasarela transaccional.
- El sitio original en `paginas/`, `js/`, `css/` y `assets/` se mantiene intacto.
