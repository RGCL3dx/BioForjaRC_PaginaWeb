(function () {
    'use strict';

    var CLAVE_CARRITO = 'bioforjarc-carrito';
    var CLAVE_PRODUCTOS = 'bioforjarc-productos';


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

    function obtenerProductoDe(articulo) {
        var titulo = articulo.querySelector('h3').textContent.trim();
        var precioTexto = articulo.querySelector('p strong').textContent.replace(/[^0-9]/g, '');
        var imagen = articulo.querySelector('img').getAttribute('src');
        var id = articulo.getAttribute('data-id');

        return {
            id: id ? parseInt(id, 10) : null,
            titulo: titulo,
            precio: parseInt(precioTexto, 10),
            imagen: imagen
        };
    }

    /* Busca el producto en el catálogo (por id o, como respaldo, por título).
       Lee el catálogo desde localStorage si productos.js no está cargado. */
    function stockProducto(item) {
        var lista = null;

        if (window.BioForjaProductos) {
            lista = BioForjaProductos.leer();
        } else {
            try {
                var datos = localStorage.getItem(CLAVE_PRODUCTOS);
                lista = datos ? JSON.parse(datos) : null;
            } catch (error) {
                lista = null;
            }
        }
        if (!lista) {
            return null;
        }

        var id = parseInt(item.id, 10);
        if (id) {
            for (var i = 0; i < lista.length; i++) {
                if (String(lista[i].id) === String(id)) {
                    return lista[i];
                }
            }
        }
        if (item.titulo) {
            for (var j = 0; j < lista.length; j++) {
                if (String(lista[j].titulo).toLowerCase() === String(item.titulo).toLowerCase()) {
                    return lista[j];
                }
            }
        }
        return null;
    }

    function descontarStock(producto, cantidad) {
        if (!producto) {
            return;
        }
        var resto = (parseInt(producto.stock, 10) || 0) - parseInt(cantidad, 10);
        if (resto < 0) {
            resto = 0;
        }
        if (window.BioForjaProductos) {
            BioForjaProductos.actualizar(producto.id, { stock: resto });
            return;
        }
        var lista = null;
        try {
            var datos = localStorage.getItem(CLAVE_PRODUCTOS);
            lista = datos ? JSON.parse(datos) : null;
        } catch (error) {
            lista = null;
        }
        if (!lista) {
            return;
        }
        for (var i = 0; i < lista.length; i++) {
            if (String(lista[i].id) === String(producto.id)) {
                lista[i].stock = resto;
                break;
            }
        }
        localStorage.setItem(CLAVE_PRODUCTOS, JSON.stringify(lista));
    }

    function agregarAlCarrito(producto) {
        var carrito = leerCarrito();
        var catalogo = stockProducto(producto);

        if (catalogo && catalogo.activo === false) {
            mostrarNotificacion(producto.titulo + ' está desactivado del catálogo y no se puede agregar.');
            return;
        }

        var stock = catalogo ? (parseInt(catalogo.stock, 10) || 0) : Infinity;

        if (stock <= 0) {
            mostrarNotificacion(producto.titulo + ' está agotado y no se puede agregar.');
            return;
        }

        for (var i = 0; i < carrito.length; i++) {
            if (carrito[i].titulo === producto.titulo) {
                if ((parseInt(carrito[i].cantidad, 10) + 1) > stock) {
                    mostrarNotificacion('Solo quedan ' + stock + ' unidades de ' + producto.titulo + ' en stock.');
                    return;
                }
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

    function renderizarTarjeta(producto) {
        var articulo = document.createElement('article');

        var imagen = document.createElement('img');
        imagen.src = producto.imagen || '../assets/imagenes/SINIMAGEN.png';
        imagen.alt = producto.titulo;

        var titulo = document.createElement('h3');
        titulo.textContent = producto.titulo;

        var precio = document.createElement('p');
        precio.textContent = 'Precio unitario: ' + formatearPrecio(producto.precio);

        var filaCantidad = document.createElement('p');
        var etiqueta = document.createElement('label');
        etiqueta.textContent = 'Cantidad (máx. ' + (producto.maxStock !== null ? producto.maxStock : '—') + ')';
        etiqueta.htmlFor = 'cantidad-' + producto.titulo.toLowerCase().replace(/[^a-z0-9]/gi, '-');
        var cantidad = document.createElement('input');
        cantidad.type = 'number';
        cantidad.id = etiqueta.htmlFor;
        cantidad.name = 'cantidad';
        cantidad.min = '1';
        cantidad.value = producto.cantidad;
        if (producto.maxStock !== null) {
            cantidad.max = String(producto.maxStock);
        }
        cantidad.setAttribute('data-producto', producto.titulo);
        filaCantidad.appendChild(etiqueta);
        filaCantidad.appendChild(cantidad);

        var subtotal = document.createElement('p');
        subtotal.className = 'subtotal-item';
        subtotal.textContent = 'Subtotal: ' + formatearPrecio(producto.precio * producto.cantidad);

        var eliminar = document.createElement('a');
        eliminar.href = 'carrito.html';
        eliminar.textContent = 'Eliminar';
        eliminar.setAttribute('data-eliminar', producto.titulo);

        articulo.appendChild(imagen);
        articulo.appendChild(titulo);
        articulo.appendChild(precio);
        articulo.appendChild(filaCantidad);
        articulo.appendChild(subtotal);
        articulo.appendChild(eliminar);

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

    function normalizarCarrito(carrito) {
        var cambio = false;
        for (var i = 0; i < carrito.length; i++) {
            var catalogo = stockProducto(carrito[i]);
            if (catalogo && catalogo.activo === false) {
                carrito.splice(i, 1);
                i--;
                cambio = true;
            } else if (catalogo) {
                var stock = parseInt(catalogo.stock, 10) || 0;
                carrito[i].maxStock = stock;
                var cantidad = parseInt(carrito[i].cantidad, 10) || 0;
                if (stock <= 0 && cantidad > 0) {
                    carrito.splice(i, 1);
                    i--;
                    cambio = true;
                } else if (cantidad > stock) {
                    carrito[i].cantidad = stock;
                    cambio = true;
                }
            } else {
                carrito[i].maxStock = null;
            }
        }
        if (cambio) {
            guardarCarrito(carrito);
        }
        return carrito;
    }

    function renderizarCarrito() {
        var carrito = normalizarCarrito(leerCarrito());
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

        var titulo = campo.getAttribute('data-producto');
        var cantidad = parseInt(campo.value, 10);
        if (!cantidad || cantidad < 1) {
            cantidad = 1;
            campo.value = 1;
        }

        var carrito = leerCarrito();
        var producto = null;
        for (var i = 0; i < carrito.length; i++) {
            if (carrito[i].titulo === titulo) {
                producto = carrito[i];
                break;
            }
        }
        if (!producto) {
            return;
        }

        var catalogo = stockProducto(producto);
        if (catalogo) {
            var stock = parseInt(catalogo.stock, 10) || 0;
            if (stock <= 0) {
                carrito = carrito.filter(function (item) { return item.titulo !== titulo; });
                guardarCarrito(carrito);
                renderizarCarrito();
                actualizarBadge();
                mostrarNotificacion(titulo + ' está agotado y se eliminó de tu carrito.');
                return;
            }
            if (cantidad > stock) {
                cantidad = stock;
                campo.value = String(stock);
                mostrarNotificacion('Solo hay ' + stock + ' unidades de ' + titulo + ' en stock.');
            }
        }

        producto.cantidad = cantidad;
        guardarCarrito(carrito);

        var contenedor = campo.closest('article');
        var subtotal = contenedor.querySelector('.subtotal-item');
        if (subtotal) {
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

    function manejarFormularioCotizacion() {
        var form = document.querySelector('form');
        if (!form || !form.querySelector('[name="categoria"]') || !form.querySelector('[name="descripcion"]')) {
            return;
        }

        form.addEventListener('submit', function (evento) {
            if (form.querySelector('.campo-error')) {
                return;
            }
            evento.preventDefault();

            function valor(nombre) {
                var nodo = form.querySelector('[name="' + nombre + '"]');
                return nodo ? nodo.value.trim() : '';
            }

            if (!window.BioForjaAuth || !BioForjaAuth.agregarCotizacion) {
                alert('No se pudo enviar la solicitud. Inténtalo de nuevo.');
                return;
            }

            BioForjaAuth.agregarCotizacion({
                nombre: valor('nombre'),
                correo: valor('correo'),
                telefono: valor('telefono'),
                categoria: valor('categoria'),
                cantidad: valor('cantidad'),
                plazo: valor('plazo'),
                descripcion: valor('descripcion'),
                fecha: new Date().toLocaleDateString('es-CL'),
                fechaISO: new Date().toISOString()
            });

            form.reset();
            mostrarNotificacion('Solicitud de cotización enviada. Un asesor te contactará pronto.');
        });
    }

    function inicializar() {
        actualizarBadge();

        manejarFormularioCotizacion();

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

                    var carrito = leerCarrito();
                    if (!carrito.length) {
                        evento.preventDefault();
                        alert('Tu carrito está vacío.');
                        return;
                    }

                    var bloqueados = [];
                    for (var b = 0; b < carrito.length; b++) {
                        var catalogo = stockProducto(carrito[b]);
                        if (catalogo && catalogo.activo === false) {
                            bloqueados.push({ titulo: carrito[b].titulo, stock: 0, inactivo: true });
                            continue;
                        }
                        if (catalogo && (parseInt(catalogo.stock, 10) || 0) < parseInt(carrito[b].cantidad, 10)) {
                            bloqueados.push({ titulo: carrito[b].titulo, stock: parseInt(catalogo.stock, 10) || 0 });
                        }
                    }
                    if (bloqueados.length) {
                        evento.preventDefault();
                        var mensaje = 'No es posible completar la compra:\n';
                        for (var m = 0; m < bloqueados.length; m++) {
                            if (bloqueados[m].inactivo) {
                                mensaje += '- ' + bloqueados[m].titulo + ' (producto desactivado del catálogo)\n';
                            } else {
                                mensaje += '- ' + bloqueados[m].titulo + ' (quedan ' + bloqueados[m].stock + ' unidades)\n';
                            }
                        }
                        alert(mensaje);
                        return;
                    }

                    evento.preventDefault();

                    var orden = construirComprobante();

                    for (var d = 0; d < orden.items.length; d++) {
                        var item = orden.items[d];
                        descontarStock(stockProducto(item), item.cantidad);
                    }

                    BioForjaAuth.guardarPedido(orden);
                    guardarCarrito([]);
                    actualizarBadge();
                    alert('¡Compra confirmada!\nN° de orden: ' + orden.orden + '\n\n' + orden.detalle +
                        '\n\nTotal: ' + formatearPrecio(orden.total) +
                        '\n\nGracias por reciclar con BioForjaRC.');
                    window.location.href = 'mi-cuenta.html#historial-compras';
                });
            }
        }
    }

    document.addEventListener('DOMContentLoaded', inicializar);

})();