(function () {
    'use strict';

    var CLAVE_USUARIOS = 'bioforjarc-usuarios';
    var CLAVE_SESION = 'bioforjarc-sesion';
    var CLAVE_PEDIDOS = 'bioforjarc-pedidos';
    var CLAVE_COTIZACIONES = 'bioforjarc-cotizaciones';
    var RUTA_ADMIN = /\/admin\//.test(window.location.pathname);


    function hashClave(texto) {
        var hash = 5381;
        var cadena = String(texto || '');
        for (var i = 0; i < cadena.length; i++) {
            hash = (((hash << 5) + hash) + cadena.charCodeAt(i)) & 0x7fffffff;
        }
        return 'h' + hash.toString(36);
    }

    /* -----------------------------------------------------
        2. Lectura / escritura de almacenamiento
       ----------------------------------------------------- */

    function leerJSON(clave, porDefecto) {
        try {
            var datos = window.localStorage.getItem(clave);
            return datos ? JSON.parse(datos) : porDefecto;
        } catch (error) {
            return porDefecto;
        }
    }

    function guardarJSON(clave, valor) {
        window.localStorage.setItem(clave, JSON.stringify(valor));
    }

    function leerUsuarios() {
        return leerJSON(CLAVE_USUARIOS, []);
    }

    function guardarUsuarios(usuarios) {
        guardarJSON(CLAVE_USUARIOS, usuarios);
    }

    function leerPedidos() {
        return leerJSON(CLAVE_PEDIDOS, []);
    }

    function guardarPedidos(pedidos) {
        guardarJSON(CLAVE_PEDIDOS, pedidos);
    }

    function leerCotizaciones() {
        return leerJSON(CLAVE_COTIZACIONES, []);
    }

    function guardarCotizaciones(cotizaciones) {
        guardarJSON(CLAVE_COTIZACIONES, cotizaciones);
    }

    function agregarCotizacion(datos) {
        var cotizaciones = leerCotizaciones();
        var mayor = 0;
        for (var i = 0; i < cotizaciones.length; i++) {
            if (cotizaciones[i].id > mayor) {
                mayor = cotizaciones[i].id;
            }
        }
        datos.id = mayor + 1;
        datos.estado = datos.estado || 'Nueva';
        cotizaciones.push(datos);
        guardarCotizaciones(cotizaciones);
        return datos;
    }

    function buscarPorCorreo(usuarios, correo) {
        for (var i = 0; i < usuarios.length; i++) {
            if (String(usuarios[i].correo).toLowerCase() === String(correo).toLowerCase()) {
                return usuarios[i];
            }
        }
        return null;
    }

    /* Une nombre y apellido para mostrarlos como un solo campo.
       Es compatible con registros antiguos que solo guardan "nombre". */
    function nombreCompleto(datos) {
        if (!datos) {
            return '';
        }
        var completo = String(datos.nombre || '').trim();
        if (datos.apellido) {
            completo = (completo + ' ' + String(datos.apellido).trim()).trim();
        }
        return completo;
    }

    /* -----------------------------------------------------
        3. Cuentas de demostración
       ----------------------------------------------------- */

    function sembrarUsuarios() {
        if (!window.localStorage.getItem(CLAVE_USUARIOS)) {
            guardarUsuarios([
                {
                    id: 1,
                    nombre: 'Administrador',
                    apellido: '',
                    rut: '11.111.111-1',
                    correo: 'admin@bioforjarc.cl',
                    telefono: '+56 9 0000 0000',
                    clave: hashClave('Admin123'),
                    rol: 'administrador',
                    estado: 'Activo',
                    direcciones: ['Santiago, Chile']
                },
                {
                    id: 2,
                    nombre: 'Hermenegildo',
                    apellido: 'González',
                    rut: '12.345.678-9',
                    correo: 'hermenegildo.gonzalez@correo.cl',
                    telefono: '+56 9 1234 5678',
                    clave: hashClave('Clave1234'),
                    rol: 'cliente',
                    estado: 'Activo',
                    direcciones: ['Av. Siempre Viva 123, Santiago Centro, Región Metropolitana']
                }
            ]);
            return;
        }

        // Actualiza cuentas de demostración antiguas (p. ej. nombre/correo de prueba)
        var usuarios = leerUsuarios();
        var cambios = false;
        for (var i = 0; i < usuarios.length; i++) {
            var u = usuarios[i];

            // Compatibilidad: separa el "nombre completo" guardado en nombre + apellido
            if (typeof u.apellido === 'undefined') {
                var partesNombre = String(u.nombre || '').trim().split(/\s+/);
                if (partesNombre.length > 1) {
                    u.apellido = partesNombre.pop();
                    u.nombre = partesNombre.join(' ');
                } else {
                    u.apellido = '';
                }
                cambios = true;
            }

            if (u.rol === 'administrador') {
                if (u.nombre !== 'Administrador' || String(u.correo).toLowerCase() !== 'admin@bioforjarc.cl') {
                    u.nombre = 'Administrador';
                    u.correo = 'admin@bioforjarc.cl';
                    cambios = true;
                }
            } else if (u.rol === 'cliente' && String(u.correo).toLowerCase() === 'juan@correo.cl') {
                u.nombre = 'Hermenegildo';
                u.apellido = 'González';
                u.correo = 'hermenegildo.gonzalez@correo.cl';
                cambios = true;
            }
        }
        if (cambios) {
            guardarUsuarios(usuarios);
            var sesion = leerSesion();
            if (sesion) {
                var actualizado = buscarPorCorreo(leerUsuarios(), sesion.correo);
                if (actualizado) {
                    guardarSesion(actualizado);
                } else {
                    cerrarSesion();
                }
            }
        }
    }

    /* -----------------------------------------------------
        4. Sesión
       ----------------------------------------------------- */

    function leerSesion() {
        try {
            var datos = window.sessionStorage.getItem(CLAVE_SESION);
            return datos ? JSON.parse(datos) : null;
        } catch (error) {
            return null;
        }
    }

    function guardarSesion(usuario) {
        window.sessionStorage.setItem(CLAVE_SESION, JSON.stringify({
            correo: usuario.correo,
            nombre: usuario.nombre,
            rol: usuario.rol,
            fechaLogin: new Date().toISOString()
        }));
    }

    function cerrarSesion() {
        window.sessionStorage.removeItem(CLAVE_SESION);
    }

    function estaLogueado() {
        return leerSesion() !== null;
    }

    function esAdmin() {
        var sesion = leerSesion();
        return sesion !== null && sesion.rol === 'administrador';
    }

    function usuarioActual() {
        var sesion = leerSesion();
        if (!sesion) {
            return null;
        }
        return buscarPorCorreo(leerUsuarios(), sesion.correo);
    }

    /* -----------------------------------------------------
        5. Pedidos
       ----------------------------------------------------- */

    function guardarPedido(pedido) {
        var pedidos = leerPedidos();
        var sesion = leerSesion();
        pedido.correo = sesion ? sesion.correo : '';
        pedido.id = pedidos.length + 1;
        pedidos.push(pedido);
        guardarPedidos(pedidos);
    }

    function pedidosDe(correo) {
        var todos = leerPedidos();
        var propios = [];
        for (var i = 0; i < todos.length; i++) {
            if (String(todos[i].correo).toLowerCase() === String(correo).toLowerCase()) {
                propios.push(todos[i]);
            }
        }
        return propios;
    }

    function actualizarEstadoPedido(id, estado) {
        var pedidos = leerPedidos();
        for (var i = 0; i < pedidos.length; i++) {
            if (pedidos[i].id === id) {
                pedidos[i].estado = estado;
            }
        }
        guardarPedidos(pedidos);
    }

    /* -----------------------------------------------------
        6. Mensajes y avisos
       ----------------------------------------------------- */

    function mostrarAviso(contenedor, mensaje) {
        var aviso = contenedor.querySelector('.aviso-auth');
        if (!aviso) {
            aviso = document.createElement('p');
            aviso.className = 'aviso-auth';
            aviso.setAttribute('role', 'alert');
            contenedor.appendChild(aviso);
        }
        // Si el contenedor es un div estático con la clase alert, quitamos el d-none de Bootstrap
        if (aviso.classList.contains('d-none')) {
            aviso.classList.remove('d-none');
        }
        aviso.textContent = mensaje;
    }

    function limpiarAviso(form) {
        var aviso = form.querySelector('.aviso-auth');
        if (aviso) {
            aviso.classList.add('d-none');
        }
    }

    function marcarErrorCampo(campo, mensaje) {
        var contenedor = campo.closest('p') || campo.parentNode;
        var aviso = contenedor.querySelector('.mensaje-error');
        if (!aviso) {
            aviso = document.createElement('small');
            aviso.className = 'mensaje-error';
            contenedor.appendChild(aviso);
        }
        aviso.textContent = mensaje;
        campo.setAttribute('aria-invalid', 'true');
    }

    /* -----------------------------------------------------
        7. Menú dinámico (header) y footer admin
       ----------------------------------------------------- */

    function cerrarSesionYRedirigir() {
        cerrarSesion();
        window.location.href = RUTA_ADMIN ? '../index.html' : 'index.html';
    }

    function enlazarCierre() {
        var enlaces = document.querySelectorAll('[data-logout]');
        for (var i = 0; i < enlaces.length; i++) {
            enlaces[i].addEventListener('click', function (evento) {
                evento.preventDefault();
                cerrarSesionYRedirigir();
            });
        }
    }

    function actualizarMenu() {
        var ingresar = document.querySelector('header nav a[href*="login.html"]');
        var registrar = document.querySelector('header nav a[href*="registro.html"]');
        ocultarAdminFooter();

        if (!ingresar || !registrar) {
            return;
        }

        var sesion = leerSesion();
        if (!sesion) {
            return;
        }

        var usuario = buscarPorCorreo(leerUsuarios(), sesion.correo);
        if (!usuario) {
            cerrarSesion();
            return;
        }

        var existentes = document.querySelectorAll('header nav .saludo-usuario');
        for (var e = 0; e < existentes.length; e++) {
            existentes[e].remove();
        }

        var saludo = document.createElement('li');
        saludo.className = 'saludo-usuario';
        saludo.appendChild(document.createTextNode('Hola, '));
        var fuerte = document.createElement('strong');
        fuerte.textContent = nombreCompleto(usuario);
        saludo.appendChild(fuerte);
        ingresar.parentNode.parentNode.insertBefore(saludo, ingresar.parentNode);

        if (usuario.rol === 'administrador') {
            ingresar.href = 'admin/index.html';
            ingresar.textContent = 'Panel admin';
        } else {
            ingresar.href = 'mi-cuenta.html';
            ingresar.textContent = 'Mi cuenta';
        }

        registrar.textContent = 'Cerrar sesión';
        registrar.href = '#';
        registrar.setAttribute('data-logout', 'true');
        enlazarCierre();
    }

    function ocultarAdminFooter() {
        if (esAdmin()) {
            return;
        }
        var enlaces = document.querySelectorAll('footer a[href*="admin/index.html"]');
        for (var i = 0; i < enlaces.length; i++) {
            var enlace = enlaces[i];
            var divisor = enlace.closest('div');
            var titulo = divisor && divisor.querySelector('h3, h5');
            if (divisor && titulo && /administración/i.test(titulo.textContent)) {
                divisor.remove();
            } else {
                var item = enlace.closest('li');
                if (item) {
                    item.remove();
                }
            }
        }
    }

    /* -----------------------------------------------------
        8. Protección de rutas
       ----------------------------------------------------- */

    function protegerMiCuenta() {
        var sesion = leerSesion();
        if (!sesion) {
            window.location.replace('login.html');
            return;
        }
        var usuario = buscarPorCorreo(leerUsuarios(), sesion.correo);
        if (!usuario) {
            cerrarSesion();
            window.location.replace('login.html');
            return;
        }
        rellenarMiCuenta(usuario);
    }

    function protegerAdmin() {
        if (!esAdmin()) {
            window.location.replace('../login.html?admin=1');
            return;
        }
        agregarCierreAdmin();
    }

    function agregarCierreAdmin() {
        var nav = document.querySelector('header nav ul');
        if (!nav || nav.querySelector('[data-logout]')) {
            return;
        }
        var item = document.createElement('li');
        var enlace = document.createElement('a');
        enlace.href = '#';
        enlace.textContent = 'Cerrar sesión';
        enlace.setAttribute('data-logout', 'true');
        item.appendChild(enlace);
        nav.appendChild(item);
        enlazarCierre();
    }

    /* -----------------------------------------------------
        9. Mi cuenta (datos dinámicos)
       ----------------------------------------------------- */

    function formatearPrecio(numero) {
        return '$' + Number(numero || 0).toLocaleString('es-CL');
    }

    function crearCelda(fila, texto) {
        var celda = document.createElement('td');
        celda.textContent = texto;
        fila.appendChild(celda);
    }

    function rellenarHistorial(correo) {
        var cuerpo = document.getElementById('cuerpo-historial');
        if (!cuerpo) {
            return;
        }
        cuerpo.innerHTML = '';
        var pedidos = pedidosDe(correo);

        if (!pedidos.length) {
            var filaVacia = document.createElement('tr');
            var celdaVacia = document.createElement('td');
            celdaVacia.colSpan = 5;
            celdaVacia.textContent = 'Aún no tienes pedidos. Cuando compres, aparecerán aquí.';
            filaVacia.appendChild(celdaVacia);
            cuerpo.appendChild(filaVacia);
            return;
        }

        for (var i = pedidos.length - 1; i >= 0; i--) {
            var pedido = pedidos[i];
            var fila = document.createElement('tr');

            crearCelda(fila, pedido.orden);
            crearCelda(fila, pedido.fecha || '');
            crearCelda(fila, formatearPrecio(pedido.total));
            crearCelda(fila, pedido.estado || 'En preparación');

            var celdaBoleta = document.createElement('td');
            var enlace = document.createElement('a');
            enlace.href = '#';
            enlace.textContent = 'Ver boleta';
            enlace.setAttribute('data-boleta', pedido.id);
            celdaBoleta.appendChild(enlace);
            fila.appendChild(celdaBoleta);

            cuerpo.appendChild(fila);
        }
    }

    function rellenarMiCuenta(usuario) {
        var saludo = document.getElementById('saludo-cuenta');
        if (saludo) {
            saludo.textContent = 'Hola, ' + nombreCompleto(usuario) + '. Estos son tus datos y el historial de tus compras.';
        }

        var campos = {
            'cuenta-nombre': nombreCompleto(usuario),
            'cuenta-rut': usuario.rut,
            'cuenta-correo': usuario.correo,
            'cuenta-telefono': usuario.telefono || '—'
        };
        for (var clave in campos) {
            if (campos.hasOwnProperty(clave)) {
                var nodo = document.getElementById(clave);
                if (nodo) {
                    nodo.textContent = campos[clave];
                }
            }
        }

        var direcciones = document.getElementById('lista-direcciones');
        if (direcciones) {
            direcciones.innerHTML = '';
            var listado = (usuario.direcciones && usuario.direcciones.length) ? usuario.direcciones : [];
            if (!listado.length) {
                listado = ['No tienes direcciones guardadas.'];
            }
            for (var d = 0; d < listado.length; d++) {
                var dir = document.createElement('li');
                dir.textContent = listado[d];
                direcciones.appendChild(dir);
            }
        }

        rellenarHistorial(usuario.correo);
    }

    /* -----------------------------------------------------
        10. Login, registro y recuperación
       ----------------------------------------------------- */

    function manejarLogin(form) {
        form.addEventListener('submit', function (evento) {
            if (form.querySelector('.campo-error')) {
                return;
            }
            evento.preventDefault();
            limpiarAviso(form);

            var correo = (form.querySelector('[name="correo"]').value || '').trim().toLowerCase();
            var clave = form.querySelector('[name="clave"]').value || '';

            var usuario = buscarPorCorreo(leerUsuarios(), correo);
            if (!usuario || usuario.clave !== hashClave(clave)) {
                mostrarAviso(form, 'Correo o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.');
                return;
            }
            if (usuario.estado && usuario.estado.toLowerCase() === 'inactivo') {
                mostrarAviso(form, 'Tu cuenta está desactivada. Contacta a un administrador.');
                return;
            }

            guardarSesion(usuario);
            if (usuario.rol === 'administrador') {
                window.location.href = 'admin/index.html';
            } else {
                window.location.href = 'mi-cuenta.html';
            }
        });
    }

    function manejarRegistro(form) {
        form.addEventListener('submit', function (evento) {
            if (form.querySelector('.campo-error')) {
                return;
            }
            evento.preventDefault();

            var usuarios = leerUsuarios();
            var correo = (form.querySelector('[name="correo"]').value || '').trim().toLowerCase();
            var existente = buscarPorCorreo(usuarios, correo);
            if (existente) {
                marcarErrorCampo(form.querySelector('[name="correo"]'), 'Ya existe una cuenta con este correo. Ingresa con él o usa otro.');
                return;
            }

            var idMayor = 0;
            for (var i = 0; i < usuarios.length; i++) {
                if (usuarios[i].id > idMayor) {
                    idMayor = usuarios[i].id;
                }
            }

            var nuevo = {
                id: idMayor + 1,
                nombre: (form.querySelector('[name="nombre"]').value || '').trim(),
                apellido: form.querySelector('[name="apellido"]')
                    ? (form.querySelector('[name="apellido"]').value || '').trim()
                    : '',
                rut: (form.querySelector('[name="rut"]').value || '').trim(),
                correo: correo,
                telefono: (form.querySelector('[name="telefono"]').value || '').trim(),
                clave: hashClave(form.querySelector('[name="clave"]').value || ''),
                rol: 'cliente',
                estado: 'Activo',
                direcciones: [],
                fechaRegistro: new Date().toLocaleDateString('es-CL')
            };

            usuarios.push(nuevo);
            guardarUsuarios(usuarios);
            guardarSesion(nuevo);
            window.location.href = 'mi-cuenta.html';
        });
    }

    function manejarRecuperacion() {
        var enlace = document.getElementById('olvide-clave');
        if (!enlace) {
            return;
        }
        enlace.addEventListener('click', function (evento) {
            evento.preventDefault();
            var seccion = enlace.closest('section');
            if (!seccion) {
                return;
            }
            var aviso = seccion.querySelector('.aviso-auth');
            if (aviso && !aviso.classList.contains('d-none')) {
                aviso.classList.add('d-none');
                return;
            }
            mostrarAviso(seccion.querySelector('form') || seccion, 'Demostración: la recuperación por correo no está operativa. Usa admin@bioforjarc.cl / Admin123 (admin) o hermenegildo.gonzalez@correo.cl / Clave1234 (cliente).');
        });
    }

    function avisoAdminRequerido() {
        // Modificado para aceptar tanto ?admin=1 como si entra directamente con la redirección
        var form = document.querySelector('form');
        if (!form) {
            return;
        }
        if (/admin=1/.test(window.location.search)) {
            mostrarAviso(form, 'Debes ser administrador para entrar.');
        }
    }

    /* -----------------------------------------------------
        10.1 Boletas de compra / venta
       ----------------------------------------------------- */

    var DESPACHO_BOLETA = {
        estandar: 'Envío estándar',
        express: 'Envío express',
        retiro: 'Retiro en tienda'
    };

    var PAGO_BOLETA = {
        tarjeta: 'Tarjeta de crédito o débito',
        transferencia: 'Transferencia bancaria'
    };

    function buscarPedido(id) {
        var pedidos = leerPedidos();
        for (var i = 0; i < pedidos.length; i++) {
            if (String(pedidos[i].id) === String(id)) {
                return pedidos[i];
            }
        }
        return null;
    }

    function datoBoleta(contenedor, etiqueta, valor) {
        var fila = document.createElement('p');
        fila.className = 'boleta-dato';
        var rotulo = document.createElement('span');
        rotulo.textContent = etiqueta + ': ';
        var contenido = document.createElement('strong');
        contenido.textContent = valor || '—';
        fila.appendChild(rotulo);
        fila.appendChild(contenido);
        contenedor.appendChild(fila);
    }

    function celdaBoleta(fila, texto) {
        var celda = document.createElement('td');
        celda.textContent = texto;
        fila.appendChild(celda);
    }

    function lineaBoleta(contenedor, etiqueta, valor, fuerte) {
        var fila = document.createElement('p');
        fila.className = 'boleta-linea' + (fuerte ? ' boleta-linea-total' : '');
        var rotulo = document.createElement('span');
        rotulo.textContent = etiqueta;
        var monto = document.createElement(fuerte ? 'strong' : 'span');
        monto.textContent = valor;
        fila.appendChild(rotulo);
        fila.appendChild(monto);
        contenedor.appendChild(fila);
    }

    function renderBoleta(pedido) {
        var contenedor = document.getElementById('contenido-boleta');
        if (!contenedor || !pedido) {
            return false;
        }
        contenedor.innerHTML = '';
        contenedor.className = 'boleta';

        var cabecera = document.createElement('div');
        cabecera.className = 'boleta-cabecera';

        var marca = document.createElement('p');
        marca.className = 'boleta-marca';
        marca.appendChild(document.createTextNode('BioForja'));
        var marcaFuerte = document.createElement('strong');
        marcaFuerte.textContent = 'RC';
        marca.appendChild(marcaFuerte);
        cabecera.appendChild(marca);

        var titulo = document.createElement('p');
        titulo.className = 'boleta-titulo';
        titulo.textContent = 'Boleta de compra';
        cabecera.appendChild(titulo);

        var orden = document.createElement('p');
        orden.className = 'boleta-orden';
        orden.textContent = 'N° ' + (pedido.orden || '—');
        cabecera.appendChild(orden);

        contenedor.appendChild(cabecera);

        var datos = document.createElement('div');
        datos.className = 'boleta-datos';
        datoBoleta(datos, 'Fecha', pedido.fecha);
        datoBoleta(datos, 'Cliente', nombreCompleto(pedido) || pedido.correo);
        datoBoleta(datos, 'Correo', pedido.correo);
        datoBoleta(datos, 'Despacho', DESPACHO_BOLETA[pedido.despacho] || pedido.despacho);
        datoBoleta(datos, 'Pago', PAGO_BOLETA[pedido.pago] || pedido.pago);
        datoBoleta(datos, 'Estado', pedido.estado);
        contenedor.appendChild(datos);

        var tabla = document.createElement('table');
        tabla.className = 'table tabla-marca boleta-tabla';

        var cabeceraTabla = document.createElement('thead');
        var filaTitulos = document.createElement('tr');
        ['Producto', 'Cantidad', 'P. unitario', 'Subtotal'].forEach(function (texto) {
            var celda = document.createElement('th');
            celda.scope = 'col';
            celda.textContent = texto;
            filaTitulos.appendChild(celda);
        });
        cabeceraTabla.appendChild(filaTitulos);
        tabla.appendChild(cabeceraTabla);

        var cuerpo = document.createElement('tbody');
        var items = pedido.items || [];
        for (var i = 0; i < items.length; i++) {
            var fila = document.createElement('tr');
            celdaBoleta(fila, items[i].titulo);
            celdaBoleta(fila, String(items[i].cantidad));
            celdaBoleta(fila, formatearPrecio(items[i].precio));
            celdaBoleta(fila, formatearPrecio(items[i].subtotal));
            cuerpo.appendChild(fila);
        }
        if (!items.length && pedido.detalle) {
            var filaDetalle = document.createElement('tr');
            var celdaDetalle = document.createElement('td');
            celdaDetalle.colSpan = 4;
            celdaDetalle.textContent = pedido.detalle;
            filaDetalle.appendChild(celdaDetalle);
            cuerpo.appendChild(filaDetalle);
        }
        tabla.appendChild(cuerpo);

        var contenedorTabla = document.createElement('div');
        contenedorTabla.className = 'table-responsive';
        contenedorTabla.appendChild(tabla);
        contenedor.appendChild(contenedorTabla);

        var totales = document.createElement('div');
        totales.className = 'boleta-totales';
        lineaBoleta(totales, 'Subtotal productos', formatearPrecio(pedido.subtotal));
        lineaBoleta(totales, 'Costo de envío', formatearPrecio(pedido.costoEnvio));
        lineaBoleta(totales, 'Total a pagar', formatearPrecio(pedido.total), true);
        contenedor.appendChild(totales);

        var pie = document.createElement('p');
        pie.className = 'boleta-pie';
        pie.textContent = 'Gracias por reciclar con BioForjaRC.';
        contenedor.appendChild(pie);

        return true;
    }

    function mostrarBoleta(id) {
        var pedido = buscarPedido(id);
        var modal = document.getElementById('modal-boleta');
        if (!pedido || !modal || !renderBoleta(pedido)) {
            return false;
        }
        if (window.bootstrap) {
            window.bootstrap.Modal.getOrCreateInstance(modal).show();
        } else {
            modal.classList.add('show');
            modal.style.display = 'block';
        }
        return true;
    }

    function enlazarBoletas() {
        document.addEventListener('click', function (evento) {
            if (!evento.target || !evento.target.closest) {
                return;
            }

            var disparador = evento.target.closest('[data-boleta]');
            if (disparador) {
                evento.preventDefault();
                mostrarBoleta(disparador.getAttribute('data-boleta'));
            }
        });
    }

    /* -----------------------------------------------------
        11. Inicialización
       ----------------------------------------------------- */

    function inicializar() {
        sembrarUsuarios();
        enlazarBoletas();

        if (RUTA_ADMIN) {
            protegerAdmin();
            return;
        }

        actualizarMenu();

        if (/mi-cuenta\.html/.test(window.location.pathname)) {
            protegerMiCuenta();
        }

        var formularios = document.querySelectorAll('form');
        for (var i = 0; i < formularios.length; i++) {
            var form = formularios[i];
            if (form.querySelector('[name="correo"]') && form.querySelector('[name="clave"]') && !form.querySelector('[name="nombre"]')) {
                manejarLogin(form);
            } else if (form.querySelector('[name="nombre"]') && form.querySelector('[name="clave"]') && form.querySelector('[name="clave-confirmar"]')) {
                manejarRegistro(form);
            }
        }

        manejarRecuperacion();
        avisoAdminRequerido();
    }

    document.addEventListener('DOMContentLoaded', inicializar);

    window.BioForjaAuth = {
        hash: hashClave,
        leerUsuarios: leerUsuarios,
        guardarUsuarios: guardarUsuarios,
        leerSesion: leerSesion,
        guardarSesion: guardarSesion,
        cerrarSesion: cerrarSesion,
        estaLogueado: estaLogueado,
        esAdmin: esAdmin,
        usuarioActual: usuarioActual,
        nombreCompleto: nombreCompleto,
        buscarPedido: buscarPedido,
        mostrarBoleta: mostrarBoleta,
        guardarPedido: guardarPedido,
        pedidosDe: pedidosDe,
        leerPedidos: leerPedidos,
        actualizarEstadoPedido: actualizarEstadoPedido,
        leerCotizaciones: leerCotizaciones,
        guardarCotizaciones: guardarCotizaciones,
        agregarCotizacion: agregarCotizacion
    };

})();