# Matriz de cumplimiento — Evaluación Parcial 2

## 1. Advertencia de alcance

Esta matriz describe el estado real del repositorio al **3 de noviembre de 2026**.
**No representa el 100 % de la evaluación**: las pruebas unitarias, la cobertura y la validación
docente del cambio de Bootstrap a Tailwind quedan pendientes.

El PDF oficial de la evaluación no está incluido en el repositorio. Los códigos `IE2.x.x` se listan
según las instrucciones recibidas; la denominación literal de cada indicador debe contrastarse con la
pauta del docente antes de la presentación.

## 2. Resumen de indicadores

| Indicador | Descripción de trabajo | Evidencia concreta | Estado |
|---|---|---|---|
| **IE2.1.1** | Frontend React + TypeScript con componentes reutilizables y diseño responsivo | `frontend/src/App.tsx`, `frontend/src/pages/**`, `frontend/src/components/ui/**`, `frontend/src/styles/base/global.css` | Implementado |
| **IE2.1.2** | Integración del frontend con los microservicios mediante el API Gateway y operaciones HTTP | `frontend/src/services/**`, `backend/api-gateway/src/main/resources/application.yml`, `docs/Mapa_API.md` | Implementado |
| **IE2.1.3** | Preparación de la presentación individual: diseño, componentes, props/estado, navegación y formularios | `docs/Guion_Presentacion.md` | Evidencia preparada; no expuesta aún |
| **IE2.1.4** | Preparación de la demostración funcional y responsiva | `docs/Guion_Presentacion.md`, sección de demostración | Evidencia preparada; flujo en vivo no verificado sin PostgreSQL |
| **IE2.2.1** | Pruebas unitarias | Pruebas unitarias retiradas por solicitud del usuario | **Pendiente** |
| **IE2.2.2** | Entorno o configuración de pruebas | Sin framework de pruebas unitarias instalado | **Pendiente** |
| **IE2.3.1** | Cobertura de pruebas | No se ejecutó ni generó cobertura | **Pendiente** |
| **IE2.3.2** | Evidencia o documento de cobertura | No existe documento de cobertura | **Pendiente** |

> Los códigos IE2.2.1, IE2.2.2, IE2.3.1 e IE2.3.2 se dejan explícitamente pendientes, tal como solicitó
> el usuario. No se fabricaron resultados ni porcentajes.

## 3. Evidencia de IE2.1.1 — Frontend React + TypeScript

| Elemento | Implementación | Archivo |
|---|---|---|
| Enrutamiento SPA | React Router con rutas públicas, privadas y administrativas | `frontend/src/App.tsx` |
| Componentes base | Button, Card, Input, Label, Select, Textarea, Dialog, AlertDialog, Table, Badge, Sheet, Skeleton, Tabs, Alert | `frontend/src/components/ui/` |
| Componentes de dominio | Navbar, Footer, ProductCard, ProductList, Pagination, StatusBadge, ConfirmModal, EmptyState, Loading, ErrorAlert | `frontend/src/components/common/`, `components/catalog/`, `components/layout/` |
| Estado global | Autenticación, carrito y notificaciones | `frontend/src/context/` |
| Tipado | Contratos TypeScript de solicitudes y respuestas | `frontend/src/types/api.ts` |
| Estilos | Tailwind v4 con tokens de marca BioForjaRC | `frontend/src/styles/base/global.css` |
| Responsividad | Grids `sm:`, `md:`, `lg:`, `xl:` y tablas dentro de `.table-wrap` | Páginas y componentes |
| Accesibilidad | Etiquetas `Label`, `aria-invalid`, foco visible, `aria-label` en botones de icono | Componentes y formularios |

**Resultado técnico:** `npm run build` y `npm run lint` finalizan correctamente.

## 4. Evidencia de IE2.1.2 — Integración HTTP

| Capacidad | Implementación |
|---|---|
| URL base configurable | `VITE_API_URL` en `frontend/src/services/http.ts`, ejemplo en `frontend/.env.example` |
| Autenticación | JWT en `Authorization: Bearer` |
| Manejo de errores | `ApiError` con `status`, `mensaje` y `detalles` |
| Sesión expirada | Evento `bioforja:session-expired` y limpieza de `localStorage` |
| Descargas | `download()` con `Content-Disposition` y nombre de archivo |
| Consumo del Gateway | Todas las llamadas usan `http://localhost:8090` salvo configuración explícita |

El detalle de cada operación está en [`Mapa_API.md`](Mapa_API.md).

## 5. Diferencia Bootstrap / Tailwind

| Aspecto | Situación |
|---|---|
| Requisito de la evaluación | La evaluación menciona Bootstrap de forma expresa |
| Decisión del usuario | Usar Tailwind CSS + shadcn/ui |
| Implementación real | Bootstrap fue retirado del frontend React; se usa Tailwind v4, Radix UI y componentes estilo shadcn/ui |
| Sitio estático original | Conserva su propia estructura y estilos en `paginas/`, `js/`, `css/` y `assets/` |
| Estado académico | **Equivalencia tecnológica pendiente de validar con el docente** |
| Afirmación permitida | Se implementó la elección tecnológica del usuario; no se afirma cumplimiento literal de Bootstrap |

## 6. Verificaciones realizadas

| Verificación | Comando | Resultado |
|---|---|---|
| Tipos + build de producción | `npm run build` (en `frontend/`) | Correcto |
| Lint del frontend | `npm run lint` (en `frontend/`) | Sin errores |
| Compilación del Gateway | `.\mvnw.cmd -DskipTests package` | Correcto |
| Compilación de ms-usuarios | `.\mvnw.cmd -DskipTests package` | Correcto |
| Compilación de ms-catalogo | `.\mvnw.cmd -DskipTests package` | Correcto |
| Compilación de ms-pedidos | `.\mvnw.cmd -DskipTests package` | Correcto |
| Compilación de ms-envios | `.\mvnw.cmd -DskipTests package` | Correcto |
| Compilación de ms-cotizaciones | `.\mvnw.cmd -DskipTests package` | Correcto |
| Compilación de ms-consultas | `.\mvnw.cmd -DskipTests package` | Correcto |
| Pruebas unitarias | — | No ejecutadas (retiradas) |
| Cobertura | — | No generada |
| Revisión manual de rutas públicas | `npm run dev` + navegador integrado (Chromium) | Inicio, productos, cotización, contacto, nosotros, login y carrito renderizan; `/admin` redirige a `/login` sin sesión |
| Navegación responsiva | Vista de 800 px de ancho | La barra superior muestra el botón “Abrir menú”; el panel lateral abre y lista los enlaces |
| Estados de error de API | Sin servicios backend activos | Las páginas muestran alertas controladas (“No se pudo conectar con el API Gateway”) sin romper la interfaz |
| Flujo E2E con servicios activos | — | No verificado: los puertos 8090–8096 estaban libres durante la revisión |

## 7. Evidencia para la presentación (IE2.1.3 e IE2.1.4)

El guion de presentación está en [`Guion_Presentacion.md`](Guion_Presentacion.md). Incluye:

- Diseño general de la aplicación React.
- Ejemplo de props y estado con archivos reales.
- Navegación y rutas protegidas.
- Formularios y validaciones.
- Demostración responsiva.
- Limitaciones que deben declararse honestamente.

No se declara una exposición ya realizada ni resultados de pruebas que no se ejecutaron.

## 8. Pendientes que impiden declarar cumplimiento total

1. IE2.2.1 — Pruebas unitarias retiradas, pendientes para una fase posterior.
2. IE2.2.2 — Entorno/configuración de pruebas unitarias no implementado.
3. IE2.3.1 — Cobertura de pruebas no generada.
4. IE2.3.2 — Documento de cobertura no elaborado.
5. Validación docente de Tailwind/shadcn/ui como equivalencia de Bootstrap.
6. Verificación funcional en vivo con PostgreSQL y los siete servicios activos.
7. Revisión manual en dispositivos móviles reales y validación de los flujos completos con PostgreSQL y los siete servicios activos. La revisión de escritorio y la navegación responsiva básica ya se registraron en la sección 6.
