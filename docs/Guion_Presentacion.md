# Guion breve de presentación individual — BioForjaRC

> Este guion está preparado para una exposición **futura**. No se declara que la presentación ya se haya
> realizado. La duración sugerida es de 8 a 12 minutos.

## 1. Apertura (1 minuto)

**Qué decir:**

> BioForjaRC es una tienda de productos sostenibles impresos en 3D con plástico PET reciclado.
> El frontend está construido con React 19, TypeScript y Vite. Para esta entrega migré la interfaz
> de Bootstrap a Tailwind CSS y componentes estilo shadcn/ui, conservando la marca, las rutas, los
> formularios y la integración con los microservicios.

**Qué mostrar:**

- `README.md` y el diagrama de arquitectura.
- `frontend/src/App.tsx` con las rutas públicas, privadas y administrativas.

## 2. Diseño React y estructura (2 minutos)

**Qué decir:**

> La aplicación separa responsabilidades en capas: `pages` para pantallas, `components/ui` para
> primitivas visuales, `components/common` para componentes de negocio reutilizables, `context` para
> estado global, `services` para HTTP y `types` para los contratos.

**Qué mostrar:**

| Carpeta | Archivo de ejemplo | Propósito |
|---|---|---|
| `frontend/src/pages/` | `ProductosPage.tsx` | Catálogo, filtros y paginación |
| `frontend/src/components/ui/` | `button.tsx` | Botón con variantes y tamaños |
| `frontend/src/components/catalog/` | `ProductCard.tsx` | Tarjeta de producto |
| `frontend/src/components/common/` | `ConfirmModal.tsx` | Confirmación reutilizable |
| `frontend/src/context/` | `CartContext.tsx` | Carrito persistente |
| `frontend/src/services/` | `catalogo.ts` | Cliente HTTP del catálogo |
| `frontend/src/types/` | `api.ts` | Contratos TypeScript |
| `frontend/src/styles/base/` | `global.css` | Tokens Tailwind y estilos base |

## 3. Ejemplo real de props y estado (2 minutos)

### Props

Abrir `frontend/src/components/catalog/ProductCard.tsx`.

**Qué explicar:**

- `ProductCard` recibe un `producto: ProductoResumen`.
- Recibe `onAgregar` como callback.
- La tarjeta decide si muestra el botón deshabilitado cuando no hay stock.
- El componente no conoce el carrito ni el backend: solo presenta datos y emite una acción.

### Estado

Abrir `frontend/src/context/CartContext.tsx` y `frontend/src/pages/CarritoPage.tsx`.

**Qué explicar:**

- El carrito vive en un contexto global y se persiste en `localStorage`.
- `subtotal` se deriva de los ítems, no se guarda como estado duplicado.
- Al cambiar cantidades se respetan los límites de stock.
- La confirmación de eliminación usa `ConfirmModal` para evitar acciones accidentales.

### Formularios

Abrir `frontend/src/pages/RegistroPage.tsx`.

**Qué explicar:**

- Validación de nombre, apellido, RUT, correo, teléfono, contraseña y términos.
- Los errores se muestran junto al campo con `.field-error` y `aria-invalid`.
- El formulario conserva los datos si el backend rechaza la solicitud.
- El botón se deshabilita mientras la operación está en curso.

## 4. Navegación y rutas protegidas (1 minuto)

**Qué mostrar:** `frontend/src/App.tsx` y `frontend/src/components/layout/Guards.tsx`.

**Qué explicar:**

- Rutas públicas: inicio, productos, detalle, carrito, login, registro, nosotros, cotización, contacto y pago de cotización.
- Rutas privadas: checkout, pedido y mi cuenta.
- Rutas administrativas: `/admin`, inventario, pedidos, usuarios y cotizaciones.
- `RequireAuth` redirige al login; `RequireAdmin` bloquea a clientes.
- La seguridad real se valida además en el backend con JWT y roles.

## 5. Integración con microservicios (2 minutos)

**Qué mostrar:** `docs/Mapa_API.md` y `frontend/src/services/http.ts`.

**Qué explicar:**

- El frontend solo conoce el API Gateway en `http://localhost:8090`.
- `http.ts` centraliza la URL base, el token JWT, el manejo de errores y las descargas.
- Cada servicio de `frontend/src/services/` corresponde a un dominio del backend.
- Los seis microservicios de negocio tienen su propia base PostgreSQL.
- El Gateway enruta `/api/auth`, `/api/usuarios`, `/api/productos`, `/api/categorias`, `/api/envios`, `/api/pedidos`, `/api/reportes`, `/api/cotizaciones` y `/api/consultas`.

## 6. Demostración funcional (3 minutos)

> Requiere PostgreSQL y los siete servicios iniciados. Si no están disponibles, mostrar el código y
> declarar la limitación; no simular un flujo exitoso.

### 6.1 Catálogo y carrito

1. Abrir `/productos`.
2. Buscar por nombre y filtrar por categoría.
3. Abrir un producto.
4. Agregar al carrito y revisar el contador del navbar.
5. Abrir `/carrito`, cambiar cantidades y mostrar el subtotal.

### 6.2 Registro y login

1. Abrir `/registro` y mostrar una validación fallida.
2. Completar el formulario o usar una cuenta semilla.
3. Iniciar sesión y mostrar el nombre en el navbar.
4. Intentar entrar a `/admin` con un cliente: debe redirigir o denegar.

### 6.3 Checkout

1. Con sesión iniciada, abrir `/checkout`.
2. Elegir región y comuna.
3. Mostrar que los métodos y costos vienen de `ms-envios`.
4. Elegir boleta o factura y pago simulado.
5. Confirmar el pedido y abrir el detalle.
6. Descargar el comprobante PDF.

> Aclarar: el pago es simulado y el stock se valida pero no se descuenta.

### 6.4 Cotización

1. Abrir `/cotizacion`.
2. Adjuntar un archivo `.STL` o `.OBJ`.
3. Enviar y mostrar el ticket generado.
4. Abrir la página de pago informativa con el ticket.

### 6.5 Panel administrativo

1. Iniciar sesión como administrador.
2. Abrir `/admin` y mostrar indicadores y exportación.
3. Abrir `/admin/inventario`, editar un producto y activarlo/desactivarlo.
4. Abrir `/admin/pedidos`, cambiar el estado de un pedido.
5. Abrir `/admin/usuarios`, editar un usuario y mostrar la restricción de la propia cuenta.
6. Abrir `/admin/cotizaciones`, descargar un archivo y guardar un presupuesto.

### 6.6 Contacto

1. Abrir `/contacto`.
2. Enviar una consulta y mostrar la confirmación.
3. Aclarar que el correo al administrador se registra en el log, no se envía por SMTP real.

## 7. Demostración responsiva (1 minuto)

**Qué hacer:**

1. Abrir las herramientas de desarrollo del navegador.
2. Probar 375 px, 768 px y escritorio.
3. Mostrar el menú móvil del navbar.
4. Mostrar una tabla administrativa con desplazamiento horizontal.
5. Mostrar que los formularios se apilan en una columna en móvil.

## 8. Cierre y limitaciones (1 minuto)

**Qué decir:**

> La entrega conserva la marca y la lógica de BioForjaRC, migra la interfaz a Tailwind y shadcn/ui y
> mantiene la integración con los microservicios. Bootstrap fue reemplazado por decisión del usuario;
> esa equivalencia queda pendiente de validar con el docente. Las pruebas unitarias y la cobertura
> fueron retiradas por solicitud y quedan para una fase posterior. El pago es simulado, los correos se
> registran en el log y el stock se valida pero no se descuenta.

**Qué mostrar al final:**

- `docs/Matriz_Cumplimiento_Evaluacion_Parcial_2.md`.
- `docs/Pendientes.md`.
- `docs/Mapa_API.md`.

## 9. Preguntas posibles y respuestas breves

| Pregunta | Respuesta sugerida |
|---|---|
| ¿Por qué Tailwind y no Bootstrap? | Fue una decisión del usuario. Se implementó Tailwind + shadcn/ui y se documenta como equivalencia pendiente de validar con el docente. |
| ¿Dónde está la seguridad? | En el backend: JWT, roles y validación de propiedad. Los guards de React solo mejoran la experiencia. |
| ¿El pago es real? | No. Es una simulación académica; no hay pasarela ni cobro efectivo. |
| ¿Se descuenta stock? | Se valida al crear el pedido, pero el descuento automático queda pendiente. |
| ¿Los correos se envían? | No en este entorno. Se escriben en el log. |
| ¿Hay pruebas unitarias? | Fueron retiradas por solicitud del usuario. Quedan pendientes. |
| ¿Se puede ver la cobertura? | No. No se generó cobertura ni se declara un porcentaje. |
