# Matriz de pruebas del frontend

Trazabilidad entre historias de usuario, criterios de aceptación y pruebas ejecutables de Vitest.
La fuente de historias es `docs/Plantilla_Gestion_Requerimientos_Scrum_RC.xlsx`.

## Comandos

```powershell
cd frontend
npm test
npm run lint
npm run build
```

## Trazabilidad

| HU | Criterio de aceptación | Archivo de prueba | Caso |
|---|---|---|---|
| HU-02.1 | Valida correo único y contraseña segura | `src/pages/RegistroPage.test.tsx` | Formulario vacío, contraseña débil, correo duplicado y registro exitoso |
| HU-02.2 | Redirige al perfil tras login y muestra alerta si las credenciales son erróneas | `src/pages/LoginPage.test.tsx` | Login inválido con `401` y login exitoso con notificación |
| HU-04.1 | Permite `.STL`/`.OBJ` de hasta 50 MB y máximo 5 archivos | `src/pages/CotizacionPage.test.tsx` | Extensión inválida, límite de 5 archivos y archivo `.STL` válido |
| HU-07.1 | Muestra imagen, cantidad y subtotal; conserva los ítems | `src/context/CartContext.test.tsx`, `src/pages/CarritoPage.test.tsx` | Agregar, persistir en `localStorage`, recuperar y calcular subtotal |
| HU-07.2 | Botones `+` y `-`; recalcula el subtotal inmediatamente | `src/pages/CarritoPage.test.tsx`, `src/context/CartContext.test.tsx` | Aumentar, disminuir, límites de stock y recálculo |
| HU-07.3 | Botón de eliminar por producto y confirmación previa | `src/pages/CarritoPage.test.tsx`, `src/components/common/ConfirmModal.test.tsx` | Cancelar la eliminación, confirmar y vaciar el carrito |
| Seguridad de rutas | Cliente no accede al panel administrativo; sesión anónima va al login | `src/components/layout/Guards.test.tsx` | Anónimo, cliente y administrador |
| Componentes | Props tipadas, composición y reutilización | `src/components/catalog/ProductCard.test.tsx`, `src/components/catalog/ProductList.test.tsx` | Datos del producto, stock, agregar y composición de la lista |
| Cliente HTTP | Errores y consultas tipadas | `src/services/http.test.ts` | Query strings, valores vacíos y `ApiError` |
| Formato | Moneda, fechas y rutas de imágenes | `src/utils/format.test.ts` | Fechas locales, estados y recursos |

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

## Fallo controlado para la demostración

1. Ejecutar `npm test` y mostrar la suite en verde.
2. En `src/context/CartContext.test.tsx`, cambiar temporalmente:
   `expect(result.current.subtotal).toBe(3000)` por `toBe(3001)`.
3. Ejecutar `npm test` y mostrar el fallo de la prueba de subtotal.
4. Revertir el cambio y ejecutar `npm test` nuevamente para mostrar la suite en verde.

No dejar el cambio modificado en el repositorio.

## Evidencia complementaria

- `npm run lint`: sin errores.
- `npm run build`: compilación TypeScript y build de producción correctos.
- Navegador real: navegación SPA sin recarga, carrito, checkout, permisos, errores y panel administrativo.
- Responsive: revisar inicio, catálogo, carrito, cuenta y panel a 375 px, 768 px y escritorio.
