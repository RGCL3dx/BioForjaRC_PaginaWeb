# Pendientes — BioForjaRC

> Documento actualizado al 3 de noviembre de 2026. No se declara cumplimiento total de la evaluación.

## 1. Pruebas unitarias y cobertura

| Pendiente | Estado | Nota |
|---|---|---|
| IE2.2.1 — Pruebas unitarias | Pendiente | Fueron retiradas por solicitud expresa del usuario; no se recrearon ni ejecutaron |
| IE2.2.2 — Entorno/configuración de pruebas | Pendiente | No hay Vitest, Testing Library, jsdom ni framework equivalente instalado en el frontend |
| IE2.3.1 — Cobertura de pruebas | Pendiente | No se ejecutó cobertura ni se generó porcentaje |
| IE2.3.2 — Documento/evidencia de cobertura | Pendiente | No se elaboró un informe de cobertura |
| Documento de cobertura de testing | Pendiente | Debe elaborarse en una fase posterior con pruebas reales |

**No existe un porcentaje de cobertura.** Cualquier cifra histórica de Vitest o Maven que aparezca en
documentos antiguos corresponde a una etapa anterior y no valida esta entrega.

## 2. Validación docente

| Pendiente | Detalle |
|---|---|
| Tailwind/shadcn/ui como equivalencia de Bootstrap | La evaluación menciona Bootstrap; el usuario eligió Tailwind CSS + shadcn/ui. Falta autorización o validación explícita del docente |
| Denominación de indicadores IE | El PDF de la evaluación no está en el repositorio; los códigos deben contrastarse con la pauta oficial |

## 3. Verificación funcional pendiente

| Área | Qué falta | Requisito para verificarlo |
|---|---|---|
| Catálogo | Ejecutar búsqueda, filtros y paginación contra el backend | PostgreSQL y `ms-catalogo` activos |
| Registro/login | Probar registro, login, sesión y cierre de sesión | PostgreSQL y `ms-usuarios` activos |
| Perfil/direcciones | Crear, editar, eliminar y marcar dirección principal | Backend activo |
| Checkout | Crear pedido y validar precios, envío y total en servidor | `ms-catalogo`, `ms-envios`, `ms-pedidos` activos |
| Comprobante | Descargar el PDF generado | Backend activo |
| Cotizaciones | Subir archivos, descargar y presupuestar | `ms-cotizaciones` activo y directorio de archivos configurado |
| Contacto | Persistir una consulta | `ms-consultas` activo |
| Panel | Dashboard, reportes y exportaciones | Todos los servicios activos |
| Seguridad | 401, 403, 404, 409 y sesión expirada | Servicios activos y cuentas semilla |
| Responsividad | Revisión formal en 375 px, 768 px y escritorio | Navegador y frontend activos |

## 4. Limitaciones externas y de alcance

| Limitación | Estado | Impacto |
|---|---|---|
| Pago real | No implementado | El pago es simulado (`pagoSimulado = true`) |
| Envío de correos | No implementado | Los mensajes se escriben en el log local |
| SMTP | No configurado | No se pueden enviar correos reales |
| Descuento de stock | No implementado | El stock se valida, pero no se descuenta al crear el pedido |
| Pasarela de cotizaciones | No implementada | El enlace de pago es informativo |
| Commit/push | No autorizado | Los cambios quedan en el árbol de trabajo |
| ZIP | Se genera localmente | No se sube al repositorio si el usuario no lo autoriza |

## 5. Recomendaciones para la siguiente fase

1. Definir con el docente si Tailwind + shadcn/ui es aceptado como equivalencia de Bootstrap.
2. Reincorporar pruebas unitarias con un framework acordado y escribir casos para carrito, checkout,
   formularios y servicios HTTP.
3. Configurar una base de datos de pruebas y ejecutar las pruebas de integración conservadas.
4. Generar cobertura real y documentarla sin inflar resultados.
5. Configurar SMTP y una pasarela de pago solo si el alcance académico lo exige.
6. Implementar el descuento de stock de forma coordinada entre `ms-pedidos` y `ms-catalogo`.
7. Verificar los flujos completos en navegador real con datos de demostración.
