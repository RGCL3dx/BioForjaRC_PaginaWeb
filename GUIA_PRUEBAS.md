# Guía de pruebas paso a paso — BioForjaRC (XAMPP + MySQL)

Checklist para comprobar que todo funciona de punta a punta.

---

## FASE 0 — Preparar el entorno

### 0.1 Encender XAMPP

1. Abre **XAMPP Control Panel**.
2. Pulsa **Start** en **Apache**.
3. Pulsa **Start** en **MySQL**.
4. Ambos deben quedar en verde con los puertos **80/443** y **3306**.
5. **No** hace falta iniciar Tomcat ni FileZilla.

✅ **Comprobación:** en el panel, Apache y MySQL dicen `running`.

---

## FASE 1 — Comprobar la base de datos en phpMyAdmin

### 1.1 Entrar a phpMyAdmin

1. Abre el navegador en: **http://localhost/phpmyadmin**
2. Usuario: **root**
3. Contraseña: *(vacía, dejar en blanco)*
4. Pulsa **Continuar**.

✅ **Comprobación:** ves el panel de phpMyAdmin con la lista de bases a la izquierda.

### 1.2 Verificar que existen las 6 bases

En la columna izquierda deben aparecer:

- `bioforja_usuarios`
- `bioforja_catalogo`
- `bioforja_envios`
- `bioforja_pedidos`
- `bioforja_cotizaciones`
- `bioforja_consultas`

✅ **Comprobación:** las 6 están listadas (además de `information_schema`, `mysql`, `performance_schema`, `phpmyadmin`, `test`).

### 1.3 Verificar datos semilla

Haz clic en `bioforja_usuarios` → pestaña **Examinar** en la tabla `usuarios`.
Debes ver 2 filas:

| id | correo | rol |
|---|---|---|
| 1 | admin@bioforjarc.cl | ADMINISTRADOR |
| 2 | hermenegildo.gonzalez@correo.cl | CLIENTE |

Luego, en `bioforja_catalogo` → tabla `productos` → **Examinar**.
✅ **Comprobación:** 18 productos (Ballena articulada, Macetero clásico, etc.).

En `bioforja_envios` → tabla `regiones` → **Examinar**.
✅ **Comprobación:** 16 regiones de Chile.

### 1.4 Probar una consulta SQL manual

1. Clic en la base `bioforja_usuarios`.
2. Pestaña **SQL**.
3. Pega y ejecuta:

```sql
SELECT id, nombre, correo, rol, estado FROM usuarios;
```

✅ **Comprobación:** devuelve las 2 filas y no da error.

---

## FASE 2 — Comprobar el backend (7 microservicios)

### 2.1 Arrancar los servicios

1. Abre **PowerShell** en la carpeta del proyecto:

```powershell
cd "$env:USERPROFILE\Desktop\BioForjaRC_PaginaWeb"
```

2. Ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\iniciar-backend.ps1
```

3. Espera el mensaje final. Debes ver los 7 puertos en verde:

```
  Puerto 8090 OK
  Puerto 8091 OK
  Puerto 8092 OK
  Puerto 8093 OK
  Puerto 8094 OK
  Puerto 8095 OK
  Puerto 8096 OK
```

✅ **Comprobación:** todos dicen `OK`.

> Si algún puerto dice `NO responde`, revisa `logs\<servicio>.log`.

### 2.2 Verificar cada servicio por separado (navegador)

Abre estas 7 URLs. Todas deben devolver un JSON con `"status":"UP"`:

| Servicio | URL |
|---|---|
| API Gateway | http://localhost:8090/actuator/health |
| ms-usuarios | http://localhost:8091/actuator/health |
| ms-catalogo | http://localhost:8092/actuator/health |
| ms-envios | http://localhost:8093/actuator/health |
| ms-pedidos | http://localhost:8094/actuator/health |
| ms-cotizaciones | http://localhost:8095/actuator/health |
| ms-consultas | http://localhost:8096/actuator/health |

✅ **Comprobación:** el Gateway muestra `"status":"UP"`; cada microservicio también.

### 2.3 Verificar que el Gateway enruta

Abre en el navegador:

```
http://localhost:8090/api/productos?pagina=0&tamano=3
```

✅ **Comprobación:** devuelve JSON con `"contenido"`, `"totalElementos": 18` y 3 productos.

Si esto funciona, el Gateway está hablando con `ms-catalogo`.

### 2.4 Confirmar que las tablas se crearon al arrancar

Vuelve a phpMyAdmin y refresca. Ahora deben existir también:

- `bioforja_pedidos` → `pedidos`, `detalles_pedido`
- `bioforja_cotizaciones` → `cotizaciones`, `archivos_cotizacion`
- `bioforja_consultas` → `consultas`

✅ **Comprobación:** las tablas aparecen (Hibernate las crea con `ddl-auto: update`).

---

## FASE 3 — Probar la API en Postman

### 3.1 Importar la colección

1. Abre **Postman**.
2. Arriba a la izquierda: **Import**.
3. Arrastra estos dos archivos (o búscalos con "Upload files"):

```
Desktop\BioForjaRC_PaginaWeb\postman\BioForjaRC.postman_collection.json
Desktop\BioForjaRC_PaginaWeb\postman\BioForjaRC.postman_environment.json
```

4. Pulsa **Import**.

✅ **Comprobación:** aparece la colección **"BioForjaRC - Pruebas Locales (XAMPP + MySQL)"** con 6 carpetas.

### 3.2 Seleccionar el entorno

1. Arriba a la derecha, en el desplegable de entornos, elige **"BioForjaRC Local"**.
2. Pasa el mouse sobre `baseUrl` para confirmar que vale `http://localhost:8090`.

✅ **Comprobación:** el entorno está seleccionado y dice `baseUrl = http://localhost:8090`.

### 3.3 Obtener los tokens (IMPORTANTE: hacerlo primero)

**Carpeta 01 - Usuarios:**

1. Abre **"Login administrador"** → **Send**.
   - Esperado: **200 OK** y un JSON con `token`, `tipo: "Bearer"`.
2. Abre **"Login cliente"** → **Send**.
   - Esperado: **200 OK** y otro JSON con `token`.

✅ **Comprobación:** en la pestaña **Variables** de la colección (clic en la colección → pestaña *Variables*), `tokenAdmin` y `tokenCliente` ya tienen valor. Si están vacías, los demás requests darán **401/403**.

### 3.4 Probar cada endpoint

Ejecuta en este orden y compara con el código esperado:

| # | Carpeta | Request | Esperado |
|---|---|---|---|
| 1 | 01 - Usuarios | Registro de cuenta | 201 (o 409 si ya existe) |
| 2 | 01 - Usuarios | Listar usuarios (admin) | 200, 2+ usuarios |
| 3 | 01 - Usuarios | Obtener usuario | 200 |
| 4 | 01 - Usuarios | Crear dirección | 200/201 |
| 5 | 01 - Usuarios | Listar direcciones | 200, 1 dirección |
| 6 | 02 - Catálogo | Listar productos | 200, 18 productos |
| 7 | 02 - Catálogo | Buscar productos | 200, resultados de "macetero" |
| 8 | 02 - Catálogo | Obtener producto | 200 |
| 9 | 02 - Catálogo | Listar categorías | 200, 4 categorías |
| 10 | 02 - Catálogo | Resumen de inventario (admin) | 200 |
| 11 | 02 - Catálogo | Crear producto (admin) | 201 |
| 12 | 02 - Catálogo | Activar/desactivar (admin) | 200 |
| 13 | 03 - Envíos | Listar regiones | 200, 16 regiones |
| 14 | 03 - Envíos | Comunas de una región | 200, comunas de Metropolitana |
| 15 | 03 - Envíos | Métodos de despacho | 200, 3 métodos |
| 16 | 03 - Envíos | Cotizar envío | 200, costo y días |
| 17 | 03 - Envíos | Opciones de despacho | 200 |
| 18 | 04 - Pedidos | Crear pedido (cliente) | 200/201, `numeroOrden`, total |
| 19 | 04 - Pedidos | Mis pedidos (cliente) | 200 |
| 20 | 04 - Pedidos | Listar pedidos (admin) | 200 |
| 21 | 04 - Pedidos | Detalle de pedido | 200 |
| 22 | 04 - Pedidos | Comprobante | 200 |
| 23 | 04 - Pedidos | Cambiar estado (admin) | 200, estado "Despachado" |
| 24 | 04 - Pedidos | Reporte de ventas | 200, totales |
| 25 | 04 - Pedidos | Exportar ventas | 200 (archivo) |
| 26 | 05 - Cotizaciones | Crear cotización | Adjunta un `.stl`; esperado 201 con `numeroTicket` |
| 27 | 05 - Cotizaciones | Listar cotizaciones | 200 |
| 28 | 05 - Cotizaciones | Detalle de cotización | 200 |
| 29 | 05 - Cotizaciones | Enviar presupuesto | 200, estado "Presupuestada" |
| 30 | 06 - Consultas | Enviar consulta | 201 |

### 3.5 Verificación cruzada: API → base de datos

Después de crear un pedido, una cotización y una consulta, ve a phpMyAdmin y ejecuta:

```sql
-- en bioforja_pedidos
SELECT id, numero_orden, total, estado FROM pedidos;
-- en bioforja_cotizaciones
SELECT id, numero_ticket, estado, monto_total FROM cotizaciones;
-- en bioforja_consultas
SELECT id, nombre, correo, asunto FROM consultas;
```

✅ **Comprobación:** las filas creadas desde Postman aparecen en MySQL.

---

## FASE 4 — Probar la página web (frontend)

### 4.1 Arrancar React

1. Abre **otra** terminal PowerShell:

```powershell
cd "$env:USERPROFILE\Desktop\BioForjaRC_PaginaWeb\frontend"
npm run dev
```

2. Espera el mensaje:

```
  VITE v...  ready in ... ms
  ➜  Local:   http://localhost:5173/
```

✅ **Comprobación:** aparece la URL `http://localhost:5173`.

### 4.2 Recorrer las páginas públicas

Abre **http://localhost:5173** y comprueba:

| Página | URL | Qué verificar |
|---|---|---|
| Inicio | `/` | Hero, líneas de productos, destacados |
| Catálogo | `/productos` | 18 productos con precio y stock |
| Detalle | `/productos/1` | Nombre, precio, descripción, botón carrito |
| Nosotros | `/nosotros` | Texto informativo |
| Contacto | `/contacto` | Formulario |
| Cotización | `/cotizacion` | Formulario con archivo `.stl`/`.obj` |
| Login | `/login` | Campos correo y contraseña |
| Registro | `/registro` | Formulario completo |

### 4.3 Probar el flujo de cliente

1. **Login** con `hermenegildo.gonzalez@correo.cl` / `ClaveCliente123!`.
2. Ve a `/productos`, pulsa **Agregar al carrito** en 2 productos.
3. Abre `/carrito` → verifica productos y total.
4. Pulsa **Ir al checkout** (`/checkout`).
5. Completa datos, elige región/comuna y método de despacho.
6. Elige método de pago (Tarjeta o Transferencia) y confirma.
7. Serás llevado a `/pedido/<id>` con el comprobante.

✅ **Comprobación:** el pedido aparece en `bioforja_pedidos.pedidos` y el estado es "En preparación" con pago "Pagado".

### 4.4 Probar el panel de administrador

1. Cierra sesión y entra con `admin@bioforjarc.cl` / `ClaveAdmin123!`.
2. Recorre:

| Página | Qué verificar |
|---|---|
| `/admin` | Métricas y reportes con datos reales |
| `/admin/inventario` | Lista de productos, editar stock |
| `/admin/pedidos` | El pedido que creaste; cambiar estado |
| `/admin/usuarios` | Los usuarios de la base |
| `/admin/cotizaciones` | La cotización enviada; presupuestar |

✅ **Comprobación:** cada cambio hecho en el panel se refleja en phpMyAdmin al refrescar.

### 4.5 Probar el formulario de contacto

1. Ve a `/contacto`.
2. Completa nombre, correo, asunto y mensaje → **Enviar**.
3. En phpMyAdmin ejecuta `SELECT * FROM bioforja_consultas.consultas;`

✅ **Comprobación:** la consulta quedó registrada.

### 4.6 Probar la subida de archivo 3D

1. Ve a `/cotizacion`.
2. Completa el formulario y adjunta un archivo `.stl` o `.obj` (menos de 50 MB).
3. Envía y anota el número de ticket.
4. Verifica en `bioforja_cotizaciones.cotizaciones` y `archivos_cotizacion`.

✅ **Comprobación:** el ticket aparece en estado "Pendiente" con el archivo asociado.

---

## FASE 5 — Saber si algo falla

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Connection refused` en 8090-8096 | Servicios apagados | `.\iniciar-backend.ps1` |
| `Communications link failure` | MySQL apagado en XAMPP | Start MySQL |
| `Access denied for user 'root'` | Clave distinta en tu XAMPP | `.\iniciar-backend.ps1 -DbPassword "tuclave"` |
| `Unknown database 'bioforja_...'` | Faltan bases | Crealas en phpMyAdmin o con el comando del README |
| `401 Unauthorized` en Postman | No ejecutaste los logins | Ejecuta "Login administrador" y "Login cliente" |
| `403 Forbidden` | Token de cliente en endpoint de admin | Usa `tokenAdmin` |
| Página en blanco en 5173 | Error de JS | F12 → Console |
| El frontend no carga datos | Gateway apagado | Verifica `http://localhost:8090/api/productos` |
| Puerto ocupado al arrancar | Ya hay una instancia | `.\detener-backend.ps1` |

### Ver el log de un servicio

```powershell
Get-Content "C:\Users\Co-Alumno\Desktop\BioForjaRC_PaginaWeb\logs\ms-pedidos.log" -Tail 40
```

### Apagar todo

```powershell
cd "$env:USERPROFILE\Desktop\BioForjaRC_PaginaWeb"
.\detener-backend.ps1
```

---

## Orden recomendado para la primera pasada

1. XAMPP (Apache + MySQL)
2. phpMyAdmin → verificar 6 bases
3. `.\iniciar-backend.ps1` → 7 puertos OK
4. Postman → logins → resto de requests
5. `npm run dev` → recorrer la web
6. Volver a phpMyAdmin → confirmar que los datos nuevos están ahí

Si un paso falla, detente ahí: los pasos siguientes dependen de ese.
