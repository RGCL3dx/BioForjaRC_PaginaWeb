/* =========================================================
   BioForjaRC - main.js
   Lógica interactiva de la tienda

   Qué hace:
   - Agrega productos al carrito desde el catálogo
     (productos.html) y lo guarda en localStorage.
   - Muestra un contador de productos en el header.
   - Actualiza cantidades, subtotales, total y elimina
     productos desde la página del carrito.
   - Calcula el costo de envío y el total en el checkout,
     y genera el comprobante de compra.
   ========================================================= */

(function () {
    'use strict';

    var CLAVE_CARRITO = 'bioforjarc-carrito';

    /* -----------------------------------------------------
       1. Utilidades: precios, persistencia y badge
       ----------------------------------------------------- */

    function formatearPrecio(numero) {
        return '$' + numero.toLocaleString('es-CL');
    }

    function leerCarrito() {
        try {
            var datos = localStorage.getItem(CLAVE_CARRITO);
            return datos ? JSON.parse(datos) : [];
        } catch (error) {
            return [];
        }
    }

    function guardarCarrito(carrito) {
        localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
    }

    function cantidadTotal(carrito) {
        var total = 0;
        for (var i = 0; i < carrito.length; i++) {
            total += parseInt(carrito[i].cantidad, 10);
        }
        return total;
    }

    /* Contador en el enlace del carrito dentro del header */
    function actualizarBadge() {
        var carrito = leerCarrito();
        var enlaces = document.querySelectorAll('header a[href*="carrito.html"], header a[href*="carrito"]');
        var total = cantidadTotal(carrito);

        for (var i = 0; i < enlaces.length; i++) {
            var enlace = enlaces[i];
            var badge = enlace.querySelector('.contador-carrito');

            if (total > 0) {
                if (!badge) {
                    badge = document.createElement('span');
                    badge.className = 'contador-carrito';
                    enlace.appendChild(badge);
                }
                badge.textContent = total;
            } else if (badge) {
                badge.remove();
            }
        }
    }

    /* Notificación visual al agregar un producto */
    function mostrarNotificacion(mensaje) {
        var notificacion = document.createElement('div');
        notificacion.className = 'aviso-carrito';
        notificacion.textContent = mensaje;
        document.body.appendChild(notificacion);

        setTimeout(function () {
            notificacion.classList.add('aviso-carrito-visible');
        }, 10);

        setTimeout(function () {
            notificacion.remove();
        }, 2600);
    }

    /* -----------------------------------------------------
       2. Catálogo (productos.html): agregar al carrito
       ----------------------------------------------------- */

    function obtenerProductoDe(articulo) {
        var titulo = articulo.querySelector('h3').textContent.trim();
        var precioTexto = articulo.querySelector('p strong').textContent.replace(/[^0-9]/g, '');
        var imagen = articulo.querySelector('img').getAttribute('src');

        return {
            titulo: titulo,
            precio: parseInt(precioTexto, 10),
            imagen: imagen
        };
    }

    function agregarAlCarrito(producto) {
        var carrito = leerCarrito();

        for (var i = 0; i < carrito.length; i++) {
            if (carrito[i].titulo === producto.titulo) {
                carrito[i].cantidad = parseInt(carrito[i].cantidad, 10) + 1;
                guardarCarrito(carrito);
                return;
            }
        }

        producto.cantidad = 1;
        carrito.push(producto);
        guardarCarrito(carrito);
    }

    function manejarCatalogo(evento) {
        var enlace = evento.target.closest('a[href*="carrito.html"]');
        if (!enlace) {
            return;
        }

        var articulo = enlace.closest('article');
        if (articulo && articulo.querySelector('h3') && articulo.querySelector('p strong')) {
            evento.preventDefault();
            agregarAlCarrito(obtenerProductoDe(articulo));
            actualizarBadge();
            mostrarNotificacion('Se agregó ' + articulo.querySelector('h3').textContent.trim() + ' a tu carrito.');
        }
    }

    /* -----------------------------------------------------
       3. Carrito (carrito.html): listado y resumen
       ----------------------------------------------------- */

    function renderizarTarjeta(producto) {
        var articulo = document.createElement('article');
        articulo.className = 'card h-100 shadow-sm';

        var imagen = document.createElement('img');
        imagen.src = producto.imagen;
        imagen.alt = producto.titulo;
        imagen.className = 'card-img-top';
        articulo.appendChild(imagen);

        var cuerpo = document.createElement('div');
        cuerpo.className = 'card-body text-center d-flex flex-column';

        var titulo = document.createElement('h3');
        titulo.className = 'card-title';
        titulo.textContent = producto.titulo;
        cuerpo.appendChild(titulo);

        var precio = document.createElement('p');
        precio.className = 'card-text';
        precio.textContent = 'Precio unitario: ' + formatearPrecio(producto.precio);
        cuerpo.appendChild(precio);

        var filaCantidad = document.createElement('p');
        var etiqueta = document.createElement('label');
        etiqueta.className = 'form-label';
        etiqueta.textContent = 'Cantidad';
        etiqueta.htmlFor = 'cantidad-' + producto.titulo.toLowerCase().replace(/[^a-z0-9]/gi, '-');
        var cantidad = document.createElement('input');
        cantidad.type = 'number';
        cantidad.id = etiqueta.htmlFor;
        cantidad.name = 'cantidad';
        cantidad.min = '1';
        cantidad.value = producto.cantidad;
        cantidad.className = 'form-control text-center mx-auto';
        cantidad.setAttribute('data-producto', producto.titulo);
        cantidad.style.maxWidth = '120px';
        filaCantidad.appendChild(etiqueta);
        filaCantidad.appendChild(cantidad);
        cuerpo.appendChild(filaCantidad);

        var subtotal = document.createElement('p');
        subtotal.className = 'subtotal-item fw-bold';
        subtotal.textContent = 'Subtotal: ' + formatearPrecio(producto.precio * producto.cantidad);
        cuerpo.appendChild(subtotal);

        var eliminar = document.createElement('a');
        eliminar.href = 'carrito.html';
        eliminar.className = 'btn btn-outline-danger btn-sm mt-auto';
        eliminar.textContent = 'Eliminar';
        eliminar.setAttribute('data-eliminar', producto.titulo);
        cuerpo.appendChild(eliminar);

        articulo.appendChild(cuerpo);

        return articulo;
    }

    function renderizarTabla(carrito) {
        var cuerpo = document.querySelector('#tabla-carrito tbody');
        if (!cuerpo) {
            return;
        }

        cuerpo.innerHTML = '';
        var filas = document.createElement('tbody');
        var total = 0;

        for (var i = 0; i < carrito.length; i++) {
            var producto = carrito[i];
            var fila = document.createElement('tr');
            var totalFila = producto.precio * producto.cantidad;
            total += totalFila;

            ['titulo', 'cantidad', 'subtotal'].forEach(function (clave) {
                var celda = document.createElement('td');
                if (clave === 'titulo') {
                    celda.textContent = producto.titulo;
                } else if (clave === 'cantidad') {
                    celda.textContent = producto.cantidad;
                } else {
                    celda.textContent = formatearPrecio(totalFila);
                }
                fila.appendChild(celda);
            });
            filas.appendChild(fila);
        }

        cuerpo.replaceWith(filas);

        var pie = document.querySelector('#tabla-carrito tfoot tr:first-child th:last-child, #tabla-carrito tfoot tr:first-child th');
        if (pie) {
            pie.textContent = formatearPrecio(total);
        }
    }

    function ocultarSiVacio(carrito) {
        var contenedorProductos = document.querySelector('.productos-carrito');
        var contenedorResumen = document.querySelector('.resumen-carrito');
        var mensajeVacio = document.querySelector('.carrito-vacio');

        if (carrito.length === 0) {
            if (contenedorProductos) {
                contenedorProductos.style.display = 'none';
            }
            if (contenedorResumen) {
                contenedorResumen.style.display = 'none';
            }
            if (!mensajeVacio) {
                var destino = contenedorProductos ? contenedorProductos.parentElement : document.querySelector('main');
                var caja = document.createElement('p');
                caja.className = 'carrito-vacio';
                caja.textContent = 'Tu carrito está vacío. Visita el catálogo para agregar productos. ';
                var enlace = document.createElement('a');
                enlace.href = 'productos.html';
                enlace.textContent = 'Ir al catálogo';
                caja.appendChild(enlace);
                destino.appendChild(caja);
            }
        }
    }

    function renderizarCarrito() {
        var carrito = leerCarrito();
        var seccion = document.querySelector('main section:nth-of-type(2)');

        if (seccion) {
            seccion.innerHTML = '<h2>Productos seleccionados</h2>';
            for (var i = 0; i < carrito.length; i++) {
                seccion.appendChild(renderizarTarjeta(carrito[i]));
            }
        }

        renderizarTabla(carrito);
        ocultarSiVacio(carrito);
    }

    function manejarCambioCantidad(evento) {
        var campo = evento.target;

        if (campo.type !== 'number' || !campo.hasAttribute('data-producto')) {
            return;
        }

        var cantidad = parseInt(campo.value, 10);
        if (!cantidad || cantidad < 1) {
            cantidad = 1;
            campo.value = 1;
        }

        var carrito = leerCarrito();
        for (var i = 0; i < carrito.length; i++) {
            if (carrito[i].titulo === campo.getAttribute('data-producto')) {
                carrito[i].cantidad = cantidad;
                break;
            }
        }

        guardarCarrito(carrito);
        var contenedor = campo.closest('article');
        var subtotal = contenedor.querySelector('.subtotal-item');
        var producto = carrito.find(function (item) { return item.titulo === campo.getAttribute('data-producto'); });
        if (subtotal && producto) {
            subtotal.textContent = 'Subtotal: ' + formatearPrecio(producto.precio * producto.cantidad);
        }
        renderizarTabla(carrito);
        actualizarBadge();
    }

    function manejarEliminar(evento) {
        var enlace = evento.target.closest('a[data-eliminar]');
        if (!enlace) {
            return;
        }

        evento.preventDefault();
        var titulo = enlace.getAttribute('data-eliminar');
        var carrito = leerCarrito().filter(function (item) { return item.titulo !== titulo; });

        guardarCarrito(carrito);
        renderizarCarrito();
        actualizarBadge();
        mostrarNotificacion(titulo + ' fue eliminado de tu carrito.');
    }

    /* -----------------------------------------------------
       4. Checkout (checkout.html): resumen y comprobante
       ----------------------------------------------------- */

    var COSTOS_ENVIO = {
        estandar: 3500,
        express: 6500,
        retiro: 0
    };

    function actualizarResumenCheckout() {
        var carrito = leerCarrito();
        var cuerpo = document.querySelector('.tabla-checkout tbody');
        var pie = document.querySelector('.tabla-checkout tfoot');
        if (!cuerpo || !pie) {
            return;
        }

        cuerpo.innerHTML = '';
        var subtotalProductos = 0;

        for (var i = 0; i < carrito.length; i++) {
            var producto = carrito[i];
            var fila = document.createElement('tr');
            var subtotalFila = producto.precio * producto.cantidad;
            subtotalProductos += subtotalFila;

            ['titulo', 'cantidad', 'subtotal'].forEach(function (clave) {
                var celda = document.createElement('td');
                if (clave === 'titulo') {
                    celda.textContent = producto.titulo;
                } else if (clave === 'cantidad') {
                    celda.textContent = producto.cantidad;
                } else {
                    celda.textContent = formatearPrecio(subtotalFila);
                }
                fila.appendChild(celda);
            });
            cuerpo.appendChild(fila);
        }

        var despachoActivo = document.querySelector('input[name="despacho"]:checked');
        var costoEnvio = despachoActivo ? COSTOS_ENVIO[despachoActivo.value] : COSTOS_ENVIO.estandar;

        pie.innerHTML =
            '<tr><th colspan="2">Subtotal productos</th><th>' + formatearPrecio(subtotalProductos) + '</th></tr>' +
            '<tr><th colspan="2">Costo de envío</th><th>' + formatearPrecio(costoEnvio) + '</th></tr>' +
            '<tr><th colspan="2">Total a pagar</th><th>' + formatearPrecio(subtotalProductos + costoEnvio) + '</th></tr>';
    }

    function construirComprobante() {
        var carrito = leerCarrito();
        var numeroOrden = 'BF-' + Date.now().toString().slice(-8);
        var filas = [];
        var items = [];
        var subtotal = 0;

        for (var i = 0; i < carrito.length; i++) {
            var producto = carrito[i];
            var subtotalFila = producto.precio * producto.cantidad;
            subtotal += subtotalFila;
            filas.push(producto.titulo + ' x' + producto.cantidad + ' = ' + formatearPrecio(subtotalFila));
            items.push({
                titulo: producto.titulo,
                cantidad: parseInt(producto.cantidad, 10),
                precio: producto.precio,
                subtotal: subtotalFila
            });
        }

        var despachoActivo = document.querySelector('input[name="despacho"]:checked');
        var pagoActivo = document.querySelector('input[name="pago"]:checked');
        var costoEnvio = despachoActivo ? COSTOS_ENVIO[despachoActivo.value] : COSTOS_ENVIO.estandar;

        return {
            orden: numeroOrden,
            detalle: filas.join('\n'),
            items: items,
            fecha: new Date().toLocaleDateString('es-CL'),
            subtotal: subtotal,
            costoEnvio: costoEnvio,
            total: subtotal + costoEnvio,
            despacho: despachoActivo ? despachoActivo.value : 'estandar',
            pago: pagoActivo ? pagoActivo.value : 'tarjeta',
            estado: 'En preparación'
        };
    }

    /* -----------------------------------------------------
       5. Inicialización y delegación de eventos
       ----------------------------------------------------- */

    function inicializar() {
        actualizarBadge();

        var catalogo = document.querySelector('#maceteros, #articulados, #sensorial, #figuras');
        if (catalogo) {
            document.addEventListener('click', manejarCatalogo);
        }

        if (document.querySelector('.productos-carrito') || document.getElementById('tabla-carrito')) {
            renderizarCarrito();
            document.addEventListener('change', manejarCambioCantidad);
            document.addEventListener('click', manejarEliminar);
        }

        var checkout = document.querySelector('.tabla-checkout');
        if (checkout) {
            actualizarResumenCheckout();
            var radiosDespacho = document.querySelectorAll('input[name="despacho"]');
            for (var i = 0; i < radiosDespacho.length; i++) {
                radiosDespacho[i].addEventListener('change', actualizarResumenCheckout);
            }

            var formCheckout = document.querySelector('.formulario-checkout') || checkout.closest('main').querySelector('form');
            if (formCheckout) {
                formCheckout.addEventListener('submit', function (evento) {
                    if (!window.BioForjaAuth || !BioForjaAuth.estaLogueado()) {
                        evento.preventDefault();
                        alert('Debes iniciar sesión para completar tu compra.');
                        window.location.href = 'login.html';
                        return;
                    }
                    var orden = construirComprobante();
                    BioForjaAuth.guardarPedido(orden);
                    guardarCarrito([]);
                    actualizarBadge();
                    alert('¡Compra confirmada!\nN° de orden: ' + orden.orden + '\n\n' + orden.detalle +
                        '\n\nTotal: ' + formatearPrecio(orden.total) +
                        '\n\nGracias por reciclar con BioForjaRC.');
                });
            }
        }
    }

    document.addEventListener('DOMContentLoaded', inicializar);

})();