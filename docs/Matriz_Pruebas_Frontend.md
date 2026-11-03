# Matriz de pruebas del frontend — documento histórico

> **Estado: histórico y no vigente.**
> Las pruebas unitarias de Vitest fueron **retiradas por solicitud del usuario** antes de esta entrega.
> Este documento se conserva únicamente como referencia de la etapa anterior. **No debe presentarse como
> validación actual ni como evidencia de cobertura.**

## 1. Qué cambió

- Se eliminaron los archivos `*.test.ts` y `*.test.tsx` del frontend.
- Se eliminó `frontend/src/test/setup.ts`.
- Se retiraron Vitest, Testing Library, jsdom y `bootstrap`/`bootstrap-icons`.
- Se retiraron los scripts `npm test` y `npm run test:watch`.
- La aplicación fue migrada a Tailwind CSS + shadcn/ui.
- El inventario completo está en [`Retiro_Pruebas_Unitarias.md`](Retiro_Pruebas_Unitarias.md).

## 2. Trazabilidad histórica (solo referencia)

La siguiente tabla describe pruebas que **ya no existen en el repositorio**. No se ejecutaron en esta
entrega y no constituyen evidencia vigente.

| HU / área | Criterio | Archivo histórico (eliminado) |
|---|---|---|
| HU-02.1 | Validación de correo único y contraseña segura | `src/pages/RegistroPage.test.tsx` |
| HU-02.2 | Redirección tras login y alerta de credenciales | `src/pages/LoginPage.test.tsx` |
| HU-04.1 | Archivos `.STL`/`.OBJ` y límite de 5 | `src/pages/CotizacionPage.test.tsx` |
| HU-07.1 | Carrito persistente y subtotal | `src/context/CartContext.test.tsx`, `src/pages/CarritoPage.test.tsx` |
| HU-07.2 | Botones `+`/`-` y recálculo | `src/pages/CarritoPage.test.tsx` |
| HU-07.3 | Eliminación con confirmación | `src/components/common/ConfirmModal.test.tsx` |
| Seguridad de rutas | Guards de autenticación y rol | `src/components/layout/Guards.test.tsx` |
| Componentes | Props tipadas y composición | `src/components/catalog/ProductCard.test.tsx`, `ProductList.test.tsx` |
| Cliente HTTP | Query strings y `ApiError` | `src/services/http.test.ts` |
| Formato | Moneda, fechas y rutas | `src/utils/format.test.ts` |

## 3. Verificaciones vigentes de esta entrega

| Verificación | Comando | Resultado |
|---|---|---|
| Build y tipos | `npm run build` | Correcto |
| Lint | `npm run lint` | Sin errores |
| Backend compila sin tests | `.\mvnw.cmd -DskipTests package` | Correcto en los siete módulos |
| Revisión manual de rutas públicas | `npm run dev` + navegador integrado | Correcta en inicio, productos, cotización, contacto, nosotros, login y carrito; `/admin` redirige a `/login` |
| Navegación responsiva básica | Ventana de 800 px | Menú lateral funcional; falta validar en dispositivos móviles reales |
| Flujos con backend activo | Servicios + PostgreSQL | Pendiente; los puertos 8090–8096 no estaban activos durante la revisión |

## 4. Lo que no debe afirmarse

- No afirmar que existen 42 pruebas aprobadas: esos archivos fueron eliminados.
- No afirmar cobertura porcentual: no se generó.
- No presentar este documento como prueba de la versión actual.
- No usar la sección histórica como sustituto de pruebas unitarias.

## 5. Documentos vigentes

- [`ERS_BioForjaRC.md`](ERS_BioForjaRC.md)
- [`Matriz_Cumplimiento_Evaluacion_Parcial_2.md`](Matriz_Cumplimiento_Evaluacion_Parcial_2.md)
- [`Mapa_API.md`](Mapa_API.md)
- [`Guion_Presentacion.md`](Guion_Presentacion.md)
- [`Pendientes.md`](Pendientes.md)
- [`Retiro_Pruebas_Unitarias.md`](Retiro_Pruebas_Unitarias.md)
