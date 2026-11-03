# Retiro de pruebas unitarias — inventario

## 1. Motivo

El usuario solicitó **eliminar las pruebas unitarias existentes** y no implementar nuevas por ahora.
La eliminación se hizo identificando archivos por contenido y uso, no solo por nombre.

Se conservaron las pruebas de integración y contexto del backend porque no son pruebas unitarias y
requieren PostgreSQL; no se ejecutaron en esta entrega.

## 2. Pruebas unitarias del frontend eliminadas

| Archivo | Tipo |
|---|---|
| `frontend/src/components/catalog/ProductCard.test.tsx` | Componente |
| `frontend/src/components/catalog/ProductList.test.tsx` | Componente |
| `frontend/src/components/common/ConfirmModal.test.tsx` | Componente |
| `frontend/src/components/layout/Guards.test.tsx` | Rutas/guards |
| `frontend/src/context/CartContext.test.tsx` | Contexto |
| `frontend/src/pages/CarritoPage.test.tsx` | Página |
| `frontend/src/pages/CotizacionPage.test.tsx` | Página |
| `frontend/src/pages/LoginPage.test.tsx` | Página |
| `frontend/src/pages/RegistroPage.test.tsx` | Página |
| `frontend/src/services/http.test.ts` | Servicio HTTP |
| `frontend/src/utils/format.test.ts` | Utilidades |
| `frontend/src/test/setup.ts` | Setup exclusivo de pruebas |

## 3. Pruebas unitarias del backend eliminadas

| Archivo | Tipo |
|---|---|
| `backend/ms-catalogo/src/test/java/cl/bioforjarc/catalogo/service/ProductoServiceImplTest.java` | Servicio |
| `backend/ms-consultas/src/test/java/cl/bioforjarc/consultas/service/ConsultaServiceImplTest.java` | Servicio |
| `backend/ms-cotizaciones/src/test/java/cl/bioforjarc/cotizaciones/service/AlmacenArchivosServiceTest.java` | Servicio |
| `backend/ms-cotizaciones/src/test/java/cl/bioforjarc/cotizaciones/service/CotizacionServiceImplTest.java` | Servicio |
| `backend/ms-envios/src/test/java/cl/bioforjarc/envios/service/EnvioServiceImplTest.java` | Servicio |
| `backend/ms-pedidos/src/test/java/cl/bioforjarc/pedidos/service/PedidoServiceImplTest.java` | Servicio |
| `backend/ms-pedidos/src/test/java/cl/bioforjarc/pedidos/service/ReporteServiceImplTest.java` | Servicio |
| `backend/ms-usuarios/src/test/java/cl/bioforjarc/usuarios/security/JwtServiceTest.java` | Seguridad |
| `backend/ms-usuarios/src/test/java/cl/bioforjarc/usuarios/service/UsuarioServiceImplTest.java` | Servicio |

## 4. Pruebas conservadas

| Archivo | Tipo |
|---|---|
| `backend/api-gateway/src/test/java/cl/bioforjarc/gateway/ApiGatewayApplicationTests.java` | Contexto |
| `backend/ms-catalogo/src/test/java/cl/bioforjarc/catalogo/MsCatalogoApplicationTests.java` | Contexto |
| `backend/ms-catalogo/src/test/java/cl/bioforjarc/catalogo/controller/ProductoControllerIntegrationTest.java` | Integración |
| `backend/ms-envios/src/test/java/cl/bioforjarc/envios/MsEnviosApplicationTests.java` | Contexto |
| `backend/ms-envios/src/test/java/cl/bioforjarc/envios/controller/EnvioControllerIntegrationTest.java` | Integración |
| `backend/ms-cotizaciones/src/test/java/cl/bioforjarc/cotizaciones/MsCotizacionesApplicationTests.java` | Contexto |
| `backend/ms-cotizaciones/src/test/java/cl/bioforjarc/cotizaciones/controller/CotizacionControllerIntegrationTest.java` | Integración |
| `backend/ms-cotizaciones/src/test/java/cl/bioforjarc/cotizaciones/security/JwtTestUtils.java` | Utilidad de integración |
| `backend/ms-usuarios/src/test/java/cl/bioforjarc/usuarios/MsUsuariosApplicationTests.java` | Contexto |
| `backend/ms-usuarios/src/test/java/cl/bioforjarc/usuarios/controller/UsuarioControllerIntegrationTest.java` | Integración |
| `backend/ms-pedidos/src/test/java/cl/bioforjarc/pedidos/MsPedidosApplicationTests.java` | Contexto |
| `backend/ms-pedidos/src/test/java/cl/bioforjarc/pedidos/controller/PedidoControllerIntegrationTest.java` | Integración |
| `backend/ms-pedidos/src/test/java/cl/bioforjarc/pedidos/security/JwtTestUtils.java` | Utilidad de integración |
| `backend/ms-consultas/src/test/java/cl/bioforjarc/consultas/MsConsultasApplicationTests.java` | Contexto |
| `backend/ms-consultas/src/test/java/cl/bioforjarc/consultas/controller/ConsultaControllerIntegrationTest.java` | Integración |

## 5. Dependencias y scripts retirados del frontend

### Dependencias eliminadas

- `bootstrap`
- `bootstrap-icons`
- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jsdom`

### Scripts eliminados de `frontend/package.json`

- `test`
- `test:watch`

### Configuración eliminada

- Configuración de Vitest en `frontend/vite.config.ts`.
- `frontend/src/test/setup.ts`.
- Referencias a `vitest/globals` y tipos de Testing Library en la configuración de TypeScript.

### Dependencias añadidas para la migración visual

- `tailwindcss` y `@tailwindcss/vite`.
- `@radix-ui/react-alert-dialog`, `@radix-ui/react-dialog`, `@radix-ui/react-label`,
  `@radix-ui/react-select`, `@radix-ui/react-slot`, `@radix-ui/react-tabs`.
- `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `tw-animate-css`.

## 6. Dependencias Java

No se retiraron starters de pruebas Java porque las pruebas de integración y contexto conservadas los
utilizan. Retirarlos rompería la compilación de esos tests.

## 7. CI

No se encontraron archivos de CI en `.github/`. No hubo pasos de pruebas unitarias que ajustar.
Se conservan los comandos de build y lint del frontend.

## 8. Verificación posterior al retiro

| Comprobación | Resultado |
|---|---|
| `npm install` | Correcto; lockfile actualizado |
| `npm run build` | Correcto |
| `npm run lint` | Sin errores |
| `.\mvnw.cmd -DskipTests package` en los siete módulos | Correcto |
| Imports huérfanos de Vitest/Testing Library/Bootstrap | Sin coincidencias en `frontend/` |

No se ejecutaron pruebas unitarias. No se generó cobertura.
