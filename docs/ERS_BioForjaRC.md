# ERS actualizado — BioForjaRC

## 1. Información del documento

| Campo | Valor |
|---|---|
| Proyecto | BioForjaRC — tienda y catálogo de productos sostenibles impresos en 3D con PET reciclado |
| Documento | Especificación de Requisitos de Software (ERS) actualizada |
| Versión | 2.0 — cierre de la Evaluación Parcial 2 |
| Fecha | 3 de noviembre de 2026 |
| Repositorio | https://github.com/RGCL3dx/BioForjaRC_PaginaWeb.git |
| Alcance de esta versión | Frontend React migrado a Tailwind CSS + shadcn/ui, integración HTTP existente y documentación académica |
| Estado | Entrega parcial. Los indicadores de pruebas unitarias y cobertura quedan pendientes por decisión del usuario |

> Este documento reemplaza las descripciones desactualizadas que indicaban Bootstrap y pruebas Vitest.
> No se inventan requisitos del PDF de evaluación. Cuando una decisión es del usuario se indica
> expresamente. La denominación exacta de los indicadores IE debe contrastarse con la pauta del docente,
> porque el PDF no está incluido en el repositorio.

## 2. Propósito y alcance

BioForjaRC es una tienda académica de productos impresos en 3D a partir de plástico PET reciclado.
El sistema permite consultar el catálogo, registrarse, iniciar sesión, gestionar el carrito, pagar de
forma simulada, solicitar cotizaciones con archivos 3D, enviar consultas y administrar productos,
pedidos, usuarios y cotizaciones.

El alcance de esta entrega comprende:

- La aplicación React + TypeScript + Vite ubicada en `frontend/`.
- La integración del frontend con los microservicios Spring Boot a través del API Gateway.
- La documentación de contratos, cumplimiento, presentación y pendientes.
- La conservación del sitio estático original en `paginas/`, `js/`, `css/` y `assets/`.

Queda fuera de alcance de esta entrega:

- Pruebas unitarias nuevas y documento de cobertura.
- Pasarela de pago real.
- Envío real de correos por SMTP.
- Descuento automático de stock al crear un pedido.
- Publicación, commit o push sin autorización del usuario.

## 3. Actores

| Actor | Descripción | Acceso |
|---|---|---|
| Visitante | Persona sin sesión que navega el catálogo, envía consultas y solicita cotizaciones | Rutas públicas |
| Cliente | Usuario registrado y activo | Checkout, pedidos propios, perfil y direcciones |
| Administrador | Usuario con rol `administrador` | Panel, inventario, pedidos, usuarios, cotizaciones y reportes |
| Sistema de correo | Adaptador que en entorno local escribe los mensajes en el log | Interno |
| API Gateway | Punto único de entrada del frontend hacia los microservicios | Infraestructura |

## 4. Arquitectura de referencia

```text
frontend React (5173)
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

Cada microservicio mantiene su propia base de datos PostgreSQL. El frontend consume únicamente
`VITE_API_URL` (por defecto `http://localhost:8090`) y nunca llama directamente a los puertos 8091–8096.

## 5. Funcionalidades implementadas

| Módulo | Funcionalidad | Estado | Archivos principales |
|---|---|---|---|
| Inicio | Portada, categorías y productos destacados | Implementado | `frontend/src/pages/HomePage.tsx` |
| Nosotros | Historia, misión, visión y compromisos | Implementado | `frontend/src/pages/NosotrosPage.tsx` |
| Catálogo | Búsqueda, filtros por categoría y material, paginación y detalle | Implementado | `frontend/src/pages/ProductosPage.tsx`, `ProductoDetallePage.tsx` |
| Carrito | Alta, edición de cantidades, eliminación y persistencia local | Implementado | `frontend/src/context/CartContext.tsx`, `CarritoPage.tsx` |
| Autenticación | Registro, login, sesión JWT y cierre de sesión | Implementado | `frontend/src/context/AuthContext.tsx`, `LoginPage.tsx`, `RegistroPage.tsx` |
| Mi cuenta | Perfil, direcciones, dirección principal e historial de pedidos | Implementado | `frontend/src/pages/MiCuentaPage.tsx` |
| Checkout | Datos de compra, despacho, documento, pago simulado y total | Implementado | `frontend/src/pages/CheckoutPage.tsx` |
| Pedidos | Detalle, estado y descarga del comprobante PDF | Implementado | `frontend/src/pages/PedidoDetallePage.tsx` |
| Cotizaciones | Formulario multipart con archivos `.STL`/`.OBJ`, ticket y página de pago informativa | Implementado | `frontend/src/pages/CotizacionPage.tsx`, `PagoCotizacionPage.tsx` |
| Contacto | Formulario persistido en `ms-consultas` | Implementado | `frontend/src/pages/ContactoPage.tsx` |
| Administración | Dashboard, inventario, pedidos, usuarios y cotizaciones | Implementado | `frontend/src/pages/admin/*.tsx` |
| Seguridad de rutas | Guards de autenticación y rol, más autorización en backend | Implementado | `frontend/src/components/layout/Guards.tsx` |
| Página no encontrada | Ruta comodín pública y administrativa | Implementado | `frontend/src/pages/NotFoundPage.tsx` |

## 6. Reglas de negocio

| Código | Regla |
|---|---|
| RN-01 | El catálogo público solo muestra productos activos. La baja de productos es lógica (`activo = false`). |
| RN-02 | Un pedido solo puede crearse con sesión iniciada y con productos activos y stock suficiente. |
| RN-03 | El correo del comprador se toma del token JWT, no del cuerpo enviado por el cliente. |
| RN-04 | Los precios, el costo de envío y el total se revalidan en el backend antes de persistir el pedido. |
| RN-05 | El pago es simulado (`pagoSimulado = true`). No se cobra realmente ni se integra una pasarela comercial. |
| RN-06 | El estado inicial de un pedido es `En preparación`; los estados administrativos son `Despachado`, `Entregado` y `Cancelado`. |
| RN-07 | El stock se valida al crear el pedido, pero no se descuenta automáticamente en esta fase. |
| RN-08 | Una cuenta inactiva no puede iniciar sesión. Un administrador no puede desactivar su propia cuenta desde el panel. |
| RN-09 | Un administrador no puede cambiar su propio correo ni su propio rol desde el panel de usuarios. |
| RN-10 | Las cotizaciones aceptan archivos `.STL` y `.OBJ` de hasta 50 MB cada uno y un máximo configurable de 5 archivos por solicitud. |
| RN-11 | Los archivos 3D se almacenan fuera del repositorio; la base de datos solo conserva metadatos y rutas relativas. |
| RN-12 | El enlace de pago de una cotización es informativo y se envía al correo registrado en el log local. |
| RN-13 | Los correos se registran en el log; no existe SMTP real configurado en este entorno. |
| RN-14 | Las direcciones pertenecen a un usuario y solo su dueño o un administrador pueden consultarlas o modificarlas. |
| RN-15 | La protección de rutas en React es complementaria; la autorización efectiva se valida en cada microservicio. |

## 7. Requisitos funcionales

| Código | Requisito | Evidencia |
|---|---|---|
| RF-01 | El visitante debe poder navegar el catálogo y filtrar por texto, categoría y material. | `ProductosPage.tsx`, `GET /api/productos` |
| RF-02 | El visitante debe poder ver la ficha de un producto activo con imágenes, precio y stock. | `ProductoDetallePage.tsx`, `GET /api/productos/{id}` |
| RF-03 | El cliente debe poder registrarse, iniciar sesión y cerrar sesión. | `RegistroPage.tsx`, `LoginPage.tsx`, `AuthContext.tsx` |
| RF-04 | El cliente debe poder administrar su perfil y sus direcciones. | `MiCuentaPage.tsx`, endpoints `/api/usuarios/{id}/direcciones` |
| RF-05 | El cliente debe poder agregar productos al carrito, cambiar cantidades y eliminar ítems. | `CartContext.tsx`, `CarritoPage.tsx` |
| RF-06 | El cliente debe poder completar el checkout con boleta o factura, retiro o envío y pago simulado. | `CheckoutPage.tsx`, `POST /api/pedidos` |
| RF-07 | El cliente debe poder consultar sus pedidos y descargar el comprobante PDF. | `MiCuentaPage.tsx`, `PedidoDetallePage.tsx` |
| RF-08 | El visitante debe poder solicitar una cotización con adjuntos 3D y recibir un ticket. | `CotizacionPage.tsx`, `POST /api/cotizaciones` |
| RF-09 | El visitante debe poder enviar una consulta de contacto persistida. | `ContactoPage.tsx`, `POST /api/consultas` |
| RF-10 | El administrador debe poder consultar indicadores y exportar reportes en Excel o PDF. | `AdminDashboardPage.tsx`, endpoints `/api/reportes` |
| RF-11 | El administrador debe poder crear, editar, activar y desactivar productos. | `AdminInventarioPage.tsx`, endpoints `/api/productos` |
| RF-12 | El administrador debe poder revisar pedidos, cambiar su estado y descargar comprobantes. | `AdminPedidosPage.tsx`, `/api/pedidos` |
| RF-13 | El administrador debe poder editar usuarios, roles y estados. | `AdminUsuariosPage.tsx`, `/api/usuarios` |
| RF-14 | El administrador debe poder revisar cotizaciones, descargar archivos y presupuestar. | `AdminCotizacionesPage.tsx`, `/api/cotizaciones` |
| RF-15 | El sistema debe mostrar estados de carga, vacío, error y éxito en las operaciones principales. | Componentes `Loading`, `EmptyState`, `ErrorAlert`, `NotificationContext` |

## 8. Requisitos no funcionales

| Código | Requisito | Cómo se aborda |
|---|---|---|
| RNF-01 | Interfaz en español y formato de moneda CLP. | `formatCLP` en `frontend/src/utils/format.ts` |
| RNF-02 | Diseño responsivo para móvil, tablet y escritorio. | Tailwind CSS, grids adaptativos y tablas con desplazamiento horizontal |
| RNF-03 | Accesibilidad básica: etiquetas asociadas, foco visible y mensajes de error cercanos al campo. | Componentes `Label`, `aria-invalid`, `.field-error` y estilos de foco globales |
| RNF-04 | Tipado estricto en TypeScript. | `tsconfig.app.json` con `strict`, `noUnusedLocals` y `noUnusedParameters` |
| RNF-05 | Manejo centralizado de URL base, JWT y errores HTTP. | `frontend/src/services/http.ts` |
| RNF-06 | Compatibilidad con el API Gateway y CORS local. | `VITE_API_URL` y configuración CORS de cada servicio |
| RNF-07 | Separación entre presentación, estado e integración HTTP. | Carpetas `pages`, `context`, `services`, `components/ui` y `components/common` |
| RNF-08 | Conservación de la identidad visual BioForjaRC. | Tokens de marca en `frontend/src/styles/base/global.css` |
| RNF-09 | No exponer contraseñas ni `claveHash` en respuestas. | DTOs de `ms-usuarios`; el frontend solo recibe `UsuarioResponse` |
| RNF-10 | Evitar doble envío y operaciones sin retroalimentación. | Estados `guardando`, `enviando`, `cargando` y botones deshabilitados |

## 9. Restricciones y decisiones técnicas

1. **Tailwind CSS + shadcn/ui en lugar de Bootstrap.** La evaluación menciona Bootstrap; el usuario
   solicitó expresamente Tailwind y shadcn/ui. Se implementó esa elección y se eliminó Bootstrap del
   frontend React. Esta es una **equivalencia tecnológica pendiente de validar con el docente**; no se
   afirma que cumpla literalmente el requisito de Bootstrap.
2. **Pruebas unitarias retiradas.** Fueron eliminadas por solicitud del usuario. Quedan pendientes para
   una fase posterior. No se ejecutaron suites unitarias ni se generó cobertura.
3. **Pruebas de integración conservadas.** Permanecen los `*IntegrationTest.java` y
   `*ApplicationTests.java` del backend; no se ejecutaron en esta entrega porque requieren PostgreSQL.
4. **Pago simulado.** No existe pasarela real ni cobro efectivo.
5. **Correos en log.** No hay SMTP configurado.
6. **Stock no descontado.** El backend valida stock al crear el pedido, pero el descuento queda pendiente.
7. **Sitio estático original intacto.** `paginas/`, `js/`, `css/` y `assets/` se conservan.
8. **Sin commit ni push.** Los cambios quedan en el árbol de trabajo a la espera de autorización.

## 10. Criterios verificables de esta entrega

| Criterio | Verificación | Estado |
|---|---|---|
| El frontend compila con TypeScript estricto y Vite | `npm run build` | Verificado |
| El frontend no tiene errores de lint | `npm run lint` | Verificado |
| El backend compila omitiendo pruebas | `.\mvnw.cmd -DskipTests package` en los siete módulos | Verificado |
| No quedan imports ni dependencias de Bootstrap en el frontend React | Búsqueda en `frontend/` y build correcto | Verificado |
| Las rutas y la lógica de negocio se conservaron | Revisión de `App.tsx`, servicios y contextos | Verificado por inspección |
| Los flujos con backend funcionan en vivo | Requiere PostgreSQL y servicios activos | No verificado en esta entrega |
| Las pruebas unitarias y la cobertura están completas | Fueron retiradas por solicitud del usuario | Pendiente |

## 11. Trazabilidad documental

- Matriz de cumplimiento: `docs/Matriz_Cumplimiento_Evaluacion_Parcial_2.md`
- Mapa de API y revisión manual: `docs/Mapa_API.md`
- Guion de presentación: `docs/Guion_Presentacion.md`
- Pendientes: `docs/Pendientes.md`
- Matriz de pruebas anterior (histórica): `docs/Matriz_Pruebas_Frontend.md`
- Instrucciones de arranque: `README.md`, `frontend/README.md`, `backend/README.md`
