# Autenticación y autorización con JWT

Implementación del cierre Full Stack (sprint 12): login con **Spring Security + JWT**, roles
`CLIENTE` / `ADMINISTRADOR`, persistencia de sesión y restricción de rutas y acciones en frontend y
backend.

## Flujo

```text
LoginPage
   │ POST /api/auth/login  { correo, clave }
   ▼
api-gateway (8090) ──► ms-usuarios (8091)
   │                      ├─ valida BCrypt
   │                      ├─ verifica estado Activo
   │                      └─ firma JWT HS256
   ▼
React guarda token + usuario en localStorage
   │
   │ Authorization: Bearer <token>
   ▼
api-gateway ──► ms-catalogo / ms-pedidos / ms-cotizaciones
                    └─ JwtAuthenticationFilter valida firma, emisor y expiración
                       └─ SecurityConfig exige autenticación o rol ADMINISTRADOR
```

Si el backend responde `401`, el cliente borra la sesión y emite el evento
`bioforja:session-expired`; `AuthContext` cierra sesión y los guards redirigen a `/login`.

## Claims del token

| Claim | Contenido | Uso |
|---|---|---|
| `iss` | `bioforjarc-ms-usuarios` | Emisor exigido al verificar |
| `sub` | Correo del usuario | Identidad de la sesión |
| `id` | ID numérico | Recuperar el perfil sin depender del estado local |
| `rol` | `ADMINISTRADOR` o `CLIENTE` | Autoridades `ROLE_*` en Spring Security |
| `nombre` | Nombre y apellido | Presentación en la interfaz |
| `iat` / `exp` | Emisión y expiración | Vigencia (24 h por defecto) |

El token se firma con HMAC-SHA256 usando `BIOFORJA_JWT_SECRET` (mínimo 32 caracteres). El mismo
secreto debe configurarse en `ms-usuarios`, `ms-catalogo`, `ms-pedidos` y `ms-cotizaciones`.

## Backend

| Servicio | Rol frente al JWT |
|---|---|
| `ms-usuarios` | Emite el token en `/api/auth/login` y lo valida en el resto de sus rutas |
| `ms-catalogo` | Valida tokens; catálogo público, escritura y stock solo administrador |
| `ms-pedidos` | Valida tokens; historial propio autenticado y reportes solo administrador |
| `ms-cotizaciones` | Valida tokens; formulario público y gestión solo administrador |
| `ms-envios`, `ms-consultas` | Servicios públicos sin JWT por diseño |

Reglas principales:

- `/api/auth/**`, health e info son públicos.
- `GET /api/usuarios/validar` es interno para `ms-pedidos`.
- Listar usuarios, cambiar roles/estados, inventario, pedidos administrativos, reportes y
  cotizaciones exigen `ROLE_ADMINISTRADOR`.
- Crear pedidos, ver el historial propio, direcciones y perfil exigen autenticación.
- Los filtros no lanzan excepciones al cliente: un token inválido deja el contexto vacío y
  `SecurityConfig` responde `401` o `403` con el formato `ErrorResponse`.

## Frontend

| Archivo | Responsabilidad |
|---|---|
| `src/pages/LoginPage.tsx` | Envía credenciales, muestra errores y redirige según rol |
| `src/context/AuthContext.tsx` | Persiste token/usuario, restaura la sesión, refresca el perfil y cierra sesión |
| `src/components/layout/Guards.tsx` | `RequireAuth` y `RequireAdmin` para rutas privadas |
| `src/services/http.ts` | Agrega `Authorization`, detecta `401` y rechaza tokens vencidos |
| `src/utils/jwt.ts` | Decodifica claims y comprueba `exp` sin validar la firma |

Al recargar la página, `AuthContext` descarta tokens vencidos, y si el token es válido recupera el
usuario con el claim `id` (`GET /api/usuarios/{id}`). Así la sesión persiste y el backend vuelve a
validar el token.

## Configuración

```powershell
$env:BIOFORJA_JWT_SECRET = "un-secreto-de-32-o-mas-caracteres"
```

Opcional:

```powershell
$env:BIOFORJA_JWT_EXPIRACION_SEGUNDOS = "86400"
```

Sin `BIOFORJA_JWT_SECRET` los servicios protegidos fallan al iniciar, por diseño.

## Pruebas

Frontend (incluye JWT, expiración y persistencia):

```powershell
cd frontend
npm test
```

Backend (unitarias de JWT, sin base de datos):

```powershell
cd backend\ms-usuarios
.\mvnw.cmd "-Dtest=JwtServiceTest,JwtAuthenticationFilterTest" test
```

- `JwtServiceTest`: claims, firma válida, token manipulado, otro secreto, otro emisor, expiración y
  secreto mínimo.
- `JwtAuthenticationFilterTest`: autenticación con rol, token inválido, ausencia de encabezado y
  token sin claim `rol`.
- `src/utils/jwt.test.ts`, `src/context/AuthContext.test.tsx` y `src/services/http.test.ts` cubren
  decodificación, sesión vencida, persistencia, login/logout y rechazo de solicitudes vencidas.

## Referencia

Patrón de rutas protegidas y token en `localStorage` basado en
[React Router, Vite and JWT Authentication](https://medium.com/@asbedb/react-router-vite-and-jwt-authentication-9abf049c3f32),
adaptado a Spring Security, roles y expiración real del token.
