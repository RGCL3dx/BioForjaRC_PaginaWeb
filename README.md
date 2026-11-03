# BioForjaRC

Tienda y catálogo de productos sostenibles impresos en 3D a partir de plástico PET reciclado.
El proyecto combina un sitio estático original con una aplicación React y una arquitectura de
microservicios Spring Boot.

- `frontend/`: React 19 + TypeScript + Vite + Tailwind CSS + componentes estilo shadcn/ui.
- `backend/`: API Gateway y seis microservicios Spring Boot 4.1.1 con Java 25 y PostgreSQL 18.
- `paginas/`, `js/`, `css/`, `assets/`: sitio estático original, conservado sin cambios.

## Versiones comprobadas

| Herramienta | Versión verificada |
|---|---|
| Node.js | v25.7.0 |
| npm | 11.10.1 |
| Java | 25.0.2 LTS |
| Spring Boot | 4.1.1 |
| React | 19.3.1 |
| Vite | 8.3.5 |
| TypeScript | ~7.0.2 |
| Tailwind CSS | 4.3.4 |
| PostgreSQL | 18 (requerido; no se verificó una instancia activa en esta entrega) |

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

Cada microservicio tiene su propia base de datos y no consulta la base de otro servicio.
La comunicación es REST síncrona a través del Gateway, con JWT, validaciones, manejo global de
errores y timeouts. El frontend consume **únicamente** el Gateway.

## Requisitos

- JDK 25
- PostgreSQL 18
- Node.js 22 o superior (verificado con 25.7.0)
- Maven Wrapper incluido en cada servicio

## Variables de entorno

### Frontend

Copia `frontend/.env.example` a `frontend/.env` o define la variable en el entorno:

```powershell
$env:VITE_API_URL="http://localhost:8090"
```

No guardes secretos en el frontend. La URL por defecto es `http://localhost:8090`.

### Backend

```powershell
$env:BIOFORJA_DB_HOST="localhost"
$env:BIOFORJA_DB_PORT="5432"
$env:BIOFORJA_DB_USERNAME="bioforja"
$env:BIOFORJA_DB_PASSWORD="<clave-local>"
$env:BIOFORJA_JWT_SECRET="<secreto-de-al-menos-32-caracteres>"
```

Cada servicio puede sobrescribir el nombre de su base con
`BIOFORJA_USUARIOS_DB_NAME`, `BIOFORJA_CATALOGO_DB_NAME`, `BIOFORJA_ENVIOS_DB_NAME`,
`BIOFORJA_PEDIDOS_DB_NAME`, `BIOFORJA_COTIZACIONES_DB_NAME` o `BIOFORJA_CONSULTAS_DB_NAME`.
Revisa [`backend/README.md`](backend/README.md) para las variables específicas.

Para crear las cuentas semilla en una base nueva:

```powershell
$env:BIOFORJA_SEMILLA_HABILITADA="true"
$env:BIOFORJA_SEMILLA_ADMIN_CLAVE="<clave-local-admin>"
$env:BIOFORJA_SEMILLA_CLIENTE_CLAVE="<clave-local-cliente>"
```

## Orden de arranque

### 1. PostgreSQL

Crea las bases de datos de los servicios y define las variables anteriores. No se versionan
credenciales ni archivos `.env` reales.

### 2. Backend

En una terminal por servicio:

```powershell
cd backend\api-gateway
.\mvnw.cmd spring-boot:run
```

Repite con `ms-usuarios`, `ms-catalogo`, `ms-envios`, `ms-pedidos`, `ms-cotizaciones` y
`ms-consultas`. Los servicios deben quedar activos en los puertos `8090` a `8096`.

Compilación sin ejecutar pruebas:

```powershell
cd backend\ms-usuarios
.\mvnw.cmd -DskipTests package
```

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`.

### 4. Acceso local

- Frontend: http://localhost:5173
- API Gateway: http://localhost:8090
- Health del Gateway: http://localhost:8090/actuator/health
- Sitio estático original: abrir `paginas/index.html` o servirlo con un servidor estático local.

## Scripts del frontend

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Verificación TypeScript y build de producción en `dist/` |
| `npm run preview` | Vista previa del build de producción |
| `npm run lint` | Análisis estático con Oxlint |

Los scripts `npm test` y `npm run test:watch` fueron retirados junto con las pruebas unitarias.

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

## Verificación de esta entrega

| Verificación | Resultado |
|---|---|
| `npm run build` | Correcto |
| `npm run lint` | Sin errores |
| `.\mvnw.cmd -DskipTests package` en los siete módulos | Correcto |
| Imports de Bootstrap en el frontend React | Sin coincidencias |
| Pruebas unitarias | Retiradas por solicitud; no ejecutadas |
| Cobertura | No generada |
| Rutas públicas en navegador integrado | Renderizan correctamente; `/admin` redirige a `/login` sin sesión |
| Navegación responsiva básica (800 px) | Botón de menú lateral funcional |
| Flujo E2E con servicios activos | No verificado: los puertos 8090–8096 estaban libres |
| Revisión en dispositivos móviles reales | Pendiente |

Las verificaciones anteriores son técnicas (build, tipos, lint y compilación). No equivalen a pruebas
unitarias ni a cobertura. Ver [`docs/Mapa_API.md`](docs/Mapa_API.md) para el detalle.

## Documentación

- [`docs/ERS_BioForjaRC.md`](docs/ERS_BioForjaRC.md) — ERS actualizado.
- [`docs/Matriz_Cumplimiento_Evaluacion_Parcial_2.md`](docs/Matriz_Cumplimiento_Evaluacion_Parcial_2.md) — matriz de cumplimiento.
- [`docs/Guion_Presentacion.md`](docs/Guion_Presentacion.md) — guion de presentación.
- [`docs/Mapa_API.md`](docs/Mapa_API.md) — contratos HTTP y revisión manual.
- [`docs/Pendientes.md`](docs/Pendientes.md) — pendientes y limitaciones.
- [`docs/Retiro_Pruebas_Unitarias.md`](docs/Retiro_Pruebas_Unitarias.md) — inventario de pruebas y dependencias retiradas.
- [`docs/Matriz_Pruebas_Frontend.md`](docs/Matriz_Pruebas_Frontend.md) — documento histórico, no vigente.
- [`frontend/README.md`](frontend/README.md) — instrucciones del frontend.
- [`backend/README.md`](backend/README.md) — instrucciones de los microservicios.

## Alcance y pendientes

- Tailwind CSS + shadcn/ui reemplaza a Bootstrap por decisión del usuario. Es una **equivalencia
  tecnológica pendiente de validar con el docente**; no se afirma cumplimiento literal de Bootstrap.
- El pago es simulado; no se integra una pasarela real.
- Los correos se escriben en el log; no hay SMTP real.
- El backend valida stock al crear un pedido, pero todavía no lo descuenta.
- El enlace de pago de cotizaciones es informativo; no existe una pasarela transaccional.
- Las pruebas unitarias y la cobertura quedan pendientes para una fase posterior.
- El sitio original en `paginas/`, `js/`, `css/` y `assets/` se mantiene intacto.

## Repositorio y entrega

- Repositorio: https://github.com/RGCL3dx/BioForjaRC_PaginaWeb.git
- ZIP del frontend: se genera como `BioForjaRC_frontend.zip` en la raíz del proyecto, excluyendo
  `node_modules`, `dist` y archivos `.env`.
- No se realizó commit, push ni cambio de visibilidad sin autorización del usuario.
