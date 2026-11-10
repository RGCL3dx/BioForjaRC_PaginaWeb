# BioForjaRC

Tienda online de productos sostenibles impresos en 3D a partir de plástico reciclado.
El proyecto incluye una aplicación frontend en React, una arquitectura de microservicios
en Spring Boot y el sitio estático original de la marca.

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, componentes estilo shadcn/ui |
| Backend | Java 25, Spring Boot, Spring Cloud Gateway, Spring Data JPA |
| Base de datos | MySQL / MariaDB de XAMPP (una base por microservicio) |
| Estilos | Tailwind CSS con tokens de marca BioForjaRC |
| Pruebas | Sin pruebas unitarias en esta versión |

## Estructura

```
BioForjaRC_PaginaWeb/
├── frontend/          Aplicación React + TypeScript
├── backend/           Microservicios Spring Boot
│   ├── api-gateway/   Punto de entrada (8090)
│   ├── ms-usuarios/   Cuentas, autenticación y direcciones (8091)
│   ├── ms-catalogo/   Productos, categorías e inventario (8092)
│   ├── ms-envios/     Regiones, comunas y tarifas (8093)
│   ├── ms-pedidos/    Pedidos, pagos y reportes (8094)
│   ├── ms-cotizaciones/ Solicitudes con archivos 3D (8095)
│   └── ms-consultas/  Formulario de contacto (8096)
├── paginas/           Sitio estático original
├── js/                JavaScript del sitio estático
├── css/               Estilos del sitio estático
└── assets/            Imágenes y recursos
```

## Requisitos

- JDK 25
- XAMPP con MySQL/MariaDB y phpMyAdmin
- Node.js 20 o superior
- Maven Wrapper incluido en cada servicio (no requiere Maven instalado)

## Configuración

Las credenciales se leen desde variables de entorno. Los valores por defecto son:

| Variable | Valor por defecto |
|---|---|
| `BIOFORJA_DB_HOST` | `localhost` |
| `BIOFORJA_DB_PORT` | `3306` |
| `BIOFORJA_DB_USERNAME` | `root` |
| `BIOFORJA_DB_PASSWORD` | *(vacío)* |
| `BIOFORJA_JWT_SECRET` | *(obligatorio, mínimo 32 caracteres)* |

Antes de iniciar los servicios:

```powershell
$env:BIOFORJA_DB_PASSWORD = "TU_CLAVE"
$env:BIOFORJA_JWT_SECRET  = "un-secreto-de-32-o-mas-caracteres"
```

El mismo `BIOFORJA_JWT_SECRET` debe usarse en `ms-usuarios`, `ms-pedidos` y `ms-cotizaciones`.

### Bases de datos

Inicia **MySQL** desde el panel de XAMPP y crea las seis bases (por ejemplo desde
phpMyAdmin en `http://localhost/phpmyadmin`), o por consola:

```powershell
$mysql = "C:\xampp\mysql\bin\mysql.exe"
"bioforja_usuarios","bioforja_catalogo","bioforja_envios","bioforja_pedidos","bioforja_cotizaciones","bioforja_consultas" |
  ForEach-Object { "CREATE DATABASE IF NOT EXISTS $_ CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" } |
  ForEach-Object { & $mysql -u root -h 127.0.0.1 -e $_ }
```

Las tablas se crean automáticamente al iniciar cada servicio (`ddl-auto: update`).

## Ejecución

### Backend

Abre una terminal por servicio:

```powershell
cd backend\ms-usuarios
.\mvnw.cmd spring-boot:run
```

Repite con `ms-catalogo`, `ms-envios`, `ms-pedidos`, `ms-cotizaciones`, `ms-consultas`
y `api-gateway`. El frontend consume únicamente el Gateway en `http://localhost:8090`.

En Linux o macOS usa `./mvnw` en lugar de `.\mvnw.cmd`.

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Disponible en `http://localhost:5173`. La URL del Gateway se configura con `VITE_API_URL`
(por defecto `http://localhost:8090`); hay un ejemplo en `frontend/.env.example`.

### Scripts del frontend

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Verificación TypeScript y build de producción |
| `npm run preview` | Vista previa del build |
| `npm run lint` | Análisis estático con Oxlint |

## Rutas del frontend

### Públicas

- `/` — inicio
- `/productos` — catálogo con búsqueda, filtros y paginación
- `/productos/:id` — detalle de producto
- `/nosotros` — información del proyecto
- `/contacto` — formulario de consultas
- `/cotizacion` — solicitud con archivos `.STL` / `.OBJ`
- `/pago-cotizacion` — información de pago de una cotización
- `/login`, `/registro` — autenticación
- `/carrito` — carrito local

### Cliente autenticado

- `/checkout` — datos de compra, despacho y pago simulado
- `/pedido/:id` — detalle y comprobante del pedido
- `/mi-cuenta` — datos personales, direcciones e historial

### Administrador

- `/admin` — panel y reportes
- `/admin/inventario` — gestión de productos y stock
- `/admin/pedidos` — pedidos y cambios de estado
- `/admin/usuarios` — cuentas y roles
- `/admin/cotizaciones` — archivos 3D y presupuestos

## Cuentas de prueba

Se crean solo si se definen las claves antes de iniciar `ms-usuarios`:

```powershell
$env:BIOFORJA_SEMILLA_ADMIN_CLAVE   = "ClaveAdmin123!"
$env:BIOFORJA_SEMILLA_CLIENTE_CLAVE = "ClaveCliente123!"
```

- Administrador: `admin@bioforjarc.cl`
- Cliente: `hermenegildo.gonzalez@correo.cl`

## Repositorio

https://github.com/RGCL3dx/BioForjaRC_PaginaWeb
