# Matriz de pruebas del frontend

Trazabilidad entre historias de usuario, criterios de aceptación y pruebas ejecutables con
**Vitest + React Testing Library**. La fuente de historias es
`docs/Plantilla_Gestion_Requerimientos_Scrum_RC.xlsx`.

## Comandos

```powershell
cd frontend
npm test                 # 53 pruebas en 10 archivos
npm run test:watch       # modo interactivo
npm run test:coverage    # reporte de cobertura en frontend/coverage/
npm run lint
npm run build
```

## Trazabilidad

| HU / requisito | Criterio de aceptación | Archivo de prueba | Casos |
|---|---|---|---|
| HU-02.1 | Valida correo único y contraseña segura | `src/pages/RegistroPage.test.tsx` | Formulario vacío, contraseña débil, contraseñas distintas, correo duplicado (`409`) y registro exitoso |
| HU-02.2 | Redirige al perfil tras login y muestra alerta si las credenciales son erróneas | `src/pages/LoginPage.test.tsx` | Login inválido (`401`), login exitoso y visibilidad de la contraseña |
| HU-04.1 | Permite `.STL`/`.OBJ` de hasta 50 MB y máximo 5 archivos | `src/pages/CotizacionPage.test.tsx` | Extensión inválida, límite de 5 archivos, archivo `.STL` válido y campos obligatorios |
| HU-07.1 | Muestra imagen, cantidad y subtotal; conserva los ítems | `src/context/CartContext.test.tsx`, `src/pages/CarritoPage.test.tsx` | Agregar, persistir en `localStorage`, recuperar y calcular subtotal |
| HU-07.2 | Botones `+` y `-`; recalcula el subtotal inmediatamente | `src/pages/CarritoPage.test.tsx`, `src/context/CartContext.test.tsx` | Aumentar, disminuir, límites de stock y recálculo |
| HU-07.3 | Botón de eliminar por producto y confirmación previa | `src/pages/CarritoPage.test.tsx` | Cancelar la eliminación, confirmar y vaciar el carrito |
| HU-12.1 | Rutas privadas y panel administrativo restringidos por rol | `src/components/layout/Guards.test.tsx` | Anónimo redirigido al login, cliente bloqueado y administrador autorizado |
| Componentes | Props tipadas, composición y reutilización | `src/components/catalog/ProductCard.test.tsx`, `src/components/catalog/ProductList.test.tsx` | Datos del producto, stock, agregar, enlaces y composición de la lista |
| Cliente HTTP | Token JWT, consultas tipadas y manejo de errores | `src/services/http.test.ts` | Query strings, `Bearer`, JSON, `204`, texto plano, `ApiError`, red caída y `401` |
| Formato | Moneda, fechas y rutas de imágenes | `src/utils/format.test.ts` | CLP, números, fechas locales, valores inválidos y recursos |

## Casos negativos incluidos

- Producto sin stock: `ProductCard` deshabilita la compra.
- Carrito sin unidades disponibles: no permite superar el stock.
- Cantidad menor a 1: se normaliza a 1.
- Eliminación de producto: no se ejecuta hasta confirmar.
- Login inválido: muestra el mensaje del backend.
- Registro duplicado: muestra el error `409`.
- Archivo de cotización con extensión incorrecta: se rechaza.
- Más de cinco archivos: se conservan solo cinco y se informa el límite.
- Cliente en `/admin`: se redirige al inicio.
- Usuario anónimo en ruta privada: se redirige al login.
- Token expirado: la sesión se limpia y se notifica con el evento `bioforja:session-expired`.

## Cobertura (última ejecución)

| Archivo | Líneas | Ramas | Funciones |
|---|---:|---:|---:|
| `src/components/catalog/ProductCard.tsx` | 100 % | 100 % | 100 % |
| `src/components/catalog/ProductList.tsx` | 100 % | 66,7 % | 100 % |
| `src/components/layout/Guards.tsx` | 85,7 % | 71,4 % | 100 % |
| `src/context/CartContext.tsx` | 100 % | 75 % | 100 % |
| `src/pages/CarritoPage.tsx` | 73,9 % | 70 % | 63,6 % |
| `src/pages/CotizacionPage.tsx` | 67,4 % | 57,6 % | 47,4 % |
| `src/pages/LoginPage.tsx` | 96,6 % | 77,3 % | 87,5 % |
| `src/pages/RegistroPage.tsx` | 95,8 % | 92,5 % | 87,5 % |
| `src/services/http.ts` | 65,7 % | 69,6 % | 81,8 % |
| `src/utils/format.ts` | 96 % | 91,7 % | 100 % |

La cobertura global es **22,4 %** porque las páginas de administración, checkout y detalle aún no
tienen pruebas. Las pruebas se concentran en la lógica crítica del sprint 9 y 10: carrito,
formularios, rutas protegidas, componentes reutilizables y cliente HTTP. El reporte HTML completo
se genera en `frontend/coverage/index.html` (carpeta ignorada por Git).

## Fallo controlado para la demostración

1. Ejecutar `npm test` y mostrar la suite en verde.
2. En `src/context/CartContext.test.tsx`, cambiar temporalmente
   `expect(result.current.subtotal).toBe(3000)` por `toBe(3001)`.
3. Ejecutar `npm test` y mostrar el fallo de la prueba de subtotal.
4. Revertir el cambio y ejecutar `npm test` nuevamente para mostrar la suite en verde.

No dejar el cambio modificado en el repositorio.

## Evidencia complementaria

- `npm run lint`: sin errores.
- `npm run build`: compilación TypeScript y build de producción correctos.
- Navegador real: navegación SPA sin recarga, carrito, checkout, permisos, errores y panel
  administrativo.
- Responsive: revisar inicio, catálogo, carrito, cuenta y panel a 375 px, 768 px y escritorio.
