(function () {
    'use strict';

    var ETIQUETAS_CATEGORIA = {
        maceteros: 'Maceteros',
        articulados: 'Animales articulados',
        sensorial: 'Sensoriales',
        figuras: 'Figuras ecológicas'
    };

    var ETIQUETAS_DESPACHO = {
        estandar: 'Envío estándar',
        express: 'Envío express',
        retiro: 'Retiro en tienda'
    };

    var ETIQUETAS_PAGO = {
        tarjeta: 'Tarjeta de crédito o débito',
        transferencia: 'Transferencia bancaria'
    };

    function formatearPrecio(numero) {
        return '$' + Number(numero || 0).toLocaleString('es-CL');
    }

    function estadoProducto(stock) {
        if (stock <= 0) { return 'Agotado'; }
        if (stock <= 5) { return 'Poco stock'; }
        return 'Activo';
    }

    function etiquetaCategoria(valor) {
        return ETIQUETAS_CATEGORIA[valor] || valor || '—';
    }

    function etiquetaDespacho(valor) {
        return ETIQUETAS_DESPACHO[valor] || valor || '—';
    }

    function etiquetaPago(valor) {
        return ETIQUETAS_PAGO[valor] || valor || '—';
    }

    function esMesActual(fecha) {
        var partes = String(fecha || '').split('-');
        if (partes.length < 3) { return false; }
        var anio = parseInt(partes[2], 10);
        var mes = parseInt(partes[1], 10);
        var ahora = new Date();
        return anio === ahora.getFullYear() && mes === (ahora.getMonth() + 1);
    }

    function pedidoActivo(estado) {
        return estado !== 'Entregado' && estado !== 'Cancelado';
    }

    /* -----------------------------------------------------
       Resumen (admin/index.html)
       ----------------------------------------------------- */

    function renderPanel() {
        var pedidos = BioForjaAuth.leerPedidos() || [];
        var ventasMes = 0;
        var activos = 0;

        for (var i = 0; i < pedidos.length; i++) {
            if (esMesActual(pedidos[i].fecha)) {
                ventasMes += pedidos[i].total || 0;
            }
            if (pedidoActivo(pedidos[i].estado)) {
                activos++;
            }
        }

        var productos = BioForjaProductos.leer() || [];
        var conStock = 0;
        var unidades = 0;
        for (var j = 0; j < productos.length; j++) {
            var stock = parseInt(productos[j].stock, 10) || 0;
            if (stock > 0) { conStock++; }
            unidades += stock;
        }

        var usuarios = BioForjaAuth.leerUsuarios() || [];

        ponerTexto('m-ventas', formatearPrecio(ventasMes));
        ponerTexto('m-pedidos', String(activos));
        ponerTexto('m-productos', conStock + ' de ' + productos.length + ' con stock (' + unidades + ' unidades)');
        ponerTexto('m-usuarios', String(usuarios.length));

        renderTopProductos(pedidos);
    }

    function ponerTexto(id, texto) {
        var nodo = document.getElementById(id);
        if (nodo) {
            nodo.textContent = texto;
        }
    }

    function renderTopProductos(pedidos) {
        var cuerpo = document.getElementById('cuerpo-top');
        if (!cuerpo) { return; }
        cuerpo.innerHTML = '';

        var mapa = {};
        for (var i = 0; i < pedidos.length; i++) {
            var items = pedidos[i].items || [];
            for (var j = 0; j < items.length; j++) {
                var item = items[j];
                var titulo = item.titulo;
                if (!mapa[titulo]) {
                    mapa[titulo] = { titulo: titulo, unidades: 0, ingresos: 0 };
                }
                mapa[titulo].unidades += parseInt(item.cantidad, 10) || 0;
                mapa[titulo].ingresos += (parseInt(item.precio, 10) || 0) * (parseInt(item.cantidad, 10) || 0);
            }
        }

        var claveMapa = Object.keys(mapa);
        if (!claveMapa.length) {
            var fila = document.createElement('tr');
            var celda = document.createElement('td');
            celda.colSpan = 3;
            celda.textContent = 'Aún no hay ventas. Los pedidos reales aparecerán aquí.';
            fila.appendChild(celda);
            cuerpo.appendChild(fila);
            return;
        }

        var ordenados = claveMapa.map(function (clave) { return mapa[clave]; });
        ordenados.sort(function (a, b) { return b.unidades - a.unidades; });
        var top = ordenados.slice(0, 5);

        for (var k = 0; k < top.length; k++) {
            var filaTop = document.createElement('tr');
            crearCelda(filaTop, top[k].titulo);
            crearCelda(filaTop, String(top[k].unidades));
            crearCelda(filaTop, formatearPrecio(top[k].ingresos));
            cuerpo.appendChild(filaTop);
        }
    }

    function crearCelda(fila, texto) {
        var celda = document.createElement('td');
        celda.textContent = texto;
        fila.appendChild(celda);
    }

    /* -----------------------------------------------------
       Inventario (admin/inventario.html)
       ----------------------------------------------------- */

    var filtroInventario = '';

    function renderInventario() {
        var products = BioForjaProductos.leer() || [];
        var cuerpo = document.getElementById('tabla-inventario');
        if (!cuerpo) { return; }
        cuerpo.innerHTML = '';

        var sinonimo = filtroInventario.toLowerCase();
        var visibles = [];
        for (var i = 0; i < products.length; i++) {
            if (!sinonimo || products[i].titulo.toLowerCase().indexOf(sinonimo) !== -1) {
                visibles.push(products[i]);
            }
        }

        if (!visibles.length) {
            var fila = document.createElement('tr');
            var celda = document.createElement('td');
            celda.colSpan = 7;
            celda.textContent = filtroInventario ? 'Sin coincidencias para tu búsqueda.' : 'No hay productos registrados. Agrega el primero con el formulario de arriba.';
            fila.appendChild(celda);
            cuerpo.appendChild(fila);
            return;
        }

        for (var j = 0; j < visibles.length; j++) {
            var producto = visibles[j];
            var filaProd = document.createElement('tr');
            filaProd.setAttribute('data-id', producto.id);

            var celdaId = document.createElement('td');
            celdaId.textContent = '#' + producto.id;
            filaProd.appendChild(celdaId);

            var celdaTitulo = document.createElement('td');
            celdaTitulo.textContent = producto.titulo;
            filaProd.appendChild(celdaTitulo);

            var celdaCategoria = document.createElement('td');
            celdaCategoria.textContent = etiquetaCategoria(producto.categoria);
            filaProd.appendChild(celdaCategoria);

            var celdaPrecio = document.createElement('td');
            var precio = document.createElement('input');
            precio.type = 'number';
            precio.min = '0';
            precio.className = 'campo-precio form-control form-control-sm d-inline-block w-auto';
            precio.value = producto.precio;
            precio.setAttribute('data-id', producto.id);
            celdaPrecio.appendChild(precio);
            filaProd.appendChild(celdaPrecio);

            var celdaStock = document.createElement('td');
            var stock = document.createElement('input');
            stock.type = 'number';
            stock.min = '0';
            stock.className = 'campo-stock form-control form-control-sm d-inline-block w-auto';
            stock.value = producto.stock;
            stock.setAttribute('data-id', producto.id);
            celdaStock.appendChild(stock);
            filaProd.appendChild(celdaStock);

            var celdaEstado = document.createElement('td');
            celdaEstado.textContent = estadoProducto(parseInt(producto.stock, 10) || 0);
            filaProd.appendChild(celdaEstado);

            var celdaAcciones = document.createElement('td');
            var botonGuardar = document.createElement('button');
            botonGuardar.type = 'button';
            botonGuardar.textContent = 'Guardar';
            botonGuardar.className = 'btn btn-success btn-sm';
            botonGuardar.setAttribute('data-guardar', producto.id);
            celdaAcciones.appendChild(botonGuardar);

            var botonEliminar = document.createElement('button');
            botonEliminar.type = 'button';
            botonEliminar.textContent = 'Eliminar';
            botonEliminar.className = 'peligro btn btn-danger btn-sm';
            botonEliminar.setAttribute('data-eliminar', producto.id);
            celdaAcciones.appendChild(botonEliminar);

            filaProd.appendChild(celdaAcciones);
            cuerpo.appendChild(filaProd);
        }
    }

    function enlazarInventario() {
        var buscador = document.getElementById('buscar-producto');
        if (buscador) {
            buscador.addEventListener('input', function () {
                filtroInventario = buscador.value.trim();
                renderInventario();
            });
        }

        var form = document.getElementById('form-agregar-producto');
        if (form) {
            form.addEventListener('submit', function (evento) {
                evento.preventDefault();
                var nombre = (form.querySelector('[name="nombre"]').value || '').trim();
                var descripcion = (form.querySelector('[name="descripcion"]').value || '').trim();
                var categoria = form.querySelector('[name="categoria"]').value;
                var precio = parseInt(form.querySelector('[name="precio"]').value, 10);
                var stock = parseInt(form.querySelector('[name="stock"]').value, 10);
                var imagen = form.querySelector('[name="imagen"]').value;

                if (!nombre) {
                    alert('Debes indicar el nombre del producto.');
                    return;
                }
                if (!categoria) {
                    alert('Selecciona una categoría.');
                    return;
                }
                if (isNaN(precio) || precio < 0) {
                    alert('Indica un precio válido (mayor o igual a 0).');
                    return;
                }
                if (isNaN(stock) || stock < 0) {
                    alert('Indica un stock válido (mayor o igual a 0).');
                    return;
                }

                BioForjaProductos.agregar({
                    titulo: nombre,
                    descripcion: descripcion,
                    categoria: categoria,
                    precio: precio,
                    stock: stock,
                    imagen: imagen
                });
                form.reset();
                renderInventario();
                window.location.hash = 'seccion-inventario';
            });
        }

        document.body.addEventListener('click', function (evento) {
            var guardar = evento.target.closest('[data-guardar]');
            if (guardar) {
                var idGuardar = parseInt(guardar.getAttribute('data-guardar'), 10);
                var filaGuardar = guardar.closest('tr');
                var precio = filaGuardar.querySelector('.campo-precio');
                var stock = filaGuardar.querySelector('.campo-stock');
                var nuevoPrecio = parseInt(precio.value, 10);
                var nuevoStock = parseInt(stock.value, 10);

                if (isNaN(nuevoPrecio) || nuevoPrecio < 0) {
                    alert('El precio debe ser un número mayor o igual a 0.');
                    return;
                }
                if (isNaN(nuevoStock) || nuevoStock < 0) {
                    alert('El stock debe ser un número mayor o igual a 0.');
                    return;
                }

                BioForjaProductos.actualizar(idGuardar, { precio: nuevoPrecio, stock: nuevoStock });
                renderInventario();
                return;
            }

            var eliminar = evento.target.closest('[data-eliminar]');
            if (eliminar) {
                var idEliminar = parseInt(eliminar.getAttribute('data-eliminar'), 10);
                var producto = BioForjaProductos.buscar(idEliminar);
                if (producto && confirm('¿Seguro que deseas eliminar "' + producto.titulo + '" del catálogo?')) {
                    BioForjaProductos.eliminar(idEliminar);
                    renderInventario();
                }
            }
        });
    }

    /* -----------------------------------------------------
       Usuarios (admin/usuarios.html)
       ----------------------------------------------------- */

    var filtroUsuarios = '';
    var usuarioLogueado = null;

    function renderUsuarios() {
        var usuarios = BioForjaAuth.leerUsuarios() || [];
        var cuerpo = document.getElementById('tabla-usuarios');
        if (!cuerpo) { return; }
        cuerpo.innerHTML = '';

        var sinonimo = filtroUsuarios.toLowerCase();
        var visibles = [];
        for (var i = 0; i < usuarios.length; i++) {
            if (!sinonimo ||
                usuarios[i].nombre.toLowerCase().indexOf(sinonimo) !== -1 ||
                usuarios[i].correo.toLowerCase().indexOf(sinonimo) !== -1) {
                visibles.push(usuarios[i]);
            }
        }

        if (!visibles.length) {
            var fila = document.createElement('tr');
            var celda = document.createElement('td');
            celda.colSpan = 6;
            celda.textContent = filtroUsuarios ? 'Sin coincidencias para tu búsqueda.' : 'No hay usuarios registrados todavía.';
            fila.appendChild(celda);
            cuerpo.appendChild(fila);
            return;
        }

        for (var j = 0; j < visibles.length; j++) {
            var usuario = visibles[j];
            var filaUsuario = document.createElement('tr');
            if (usuario.correo === (usuarioLogueado || {}).correo) {
                filaUsuario.className = 'fila-actual';
            }

            crearCelda(filaUsuario, String(usuario.id));
            crearCelda(filaUsuario, usuario.nombre);
            crearCelda(filaUsuario, usuario.correo);
            crearCelda(filaUsuario, usuario.rol);
            crearCelda(filaUsuario, usuario.estado);

            var celdaAcciones = document.createElement('td');
            var esActual = usuario.correo === (usuarioLogueado || {}).correo;

            var botonEditar = document.createElement('button');
            botonEditar.type = 'button';
            botonEditar.textContent = 'Editar';
            botonEditar.className = 'btn btn-outline-success btn-sm';
            botonEditar.setAttribute('data-editar', usuario.id);
            if (esActual) { botonEditar.disabled = true; botonEditar.title = 'No puedes editar tu propia cuenta mientras estás conectado.'; }
            celdaAcciones.appendChild(botonEditar);

            var botonEstado = document.createElement('button');
            botonEstado.type = 'button';
            botonEstado.textContent = usuario.estado === 'Activo' ? 'Desactivar' : 'Activar';
            botonEstado.className = 'btn btn-outline-secondary btn-sm';
            botonEstado.setAttribute('data-estado', usuario.id);
            if (esActual) { botonEstado.disabled = true; botonEstado.title = 'No puedes desactivar tu propia cuenta.'; }
            celdaAcciones.appendChild(botonEstado);

            filaUsuario.appendChild(celdaAcciones);
            cuerpo.appendChild(filaUsuario);
        }
    }

    function enlazarUsuarios() {
        var buscador = document.getElementById('buscar-usuario');
        if (buscador) {
            buscador.addEventListener('input', function () {
                filtroUsuarios = buscador.value.trim();
                renderUsuarios();
            });
        }

        document.body.addEventListener('click', function (evento) {
            var editar = evento.target.closest('[data-editar]');
            if (editar) {
                var idEdit = parseInt(editar.getAttribute('data-editar'), 10);
                cargarUsuarioEnFormulario(idEdit);
                return;
            }

            var estado = evento.target.closest('[data-estado]');
            if (estado) {
                var idEstado = parseInt(estado.getAttribute('data-estado'), 10);
                var lista = BioForjaAuth.leerUsuarios() || [];
                for (var i = 0; i < lista.length; i++) {
                    if (lista[i].id === idEstado) {
                        lista[i].estado = lista[i].estado === 'Activo' ? 'Inactivo' : 'Activo';
                    }
                }
                BioForjaAuth.guardarUsuarios(lista);
                renderUsuarios();
            }
        });
    }

    function cargarUsuarioEnFormulario(id) {
        var usuarios = BioForjaAuth.leerUsuarios() || [];
        var usuario = null;
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].id === id) {
                usuario = usuarios[i];
                break;
            }
        }
        if (!usuario) { return; }

        var form = document.getElementById('form-editar-usuario');
        if (!form) { return; }

        form.querySelector('#edit-id').value = usuario.id;
        form.querySelector('[name="edit-nombre"]').value = usuario.nombre;
        form.querySelector('[name="edit-correo"]').value = usuario.correo;
        form.querySelector('[name="edit-telefono"]').value = usuario.telefono || '';
        form.querySelector('[name="edit-rol"]').value = usuario.rol || 'cliente';
        form.querySelector('[name="edit-estado"]').value = usuario.estado || 'Activo';

        var esActual = usuario.correo === (usuarioLogueado || {}).correo;
        form.querySelector('[name="edit-rol"]').disabled = esActual;
        form.querySelector('[name="edit-estado"]').disabled = esActual;

        var aviso = form.querySelector('.aviso-sesion');
        if (aviso) {
            aviso.style.display = esActual ? 'block' : 'none';
        }

        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function enlazarFormularioUsuario() {
        var form = document.getElementById('form-editar-usuario');
        if (!form) { return; }

        form.addEventListener('submit', function (evento) {
            evento.preventDefault();
            var id = parseInt(form.querySelector('#edit-id').value, 10);
            var nombre = (form.querySelector('[name="edit-nombre"]').value || '').trim();
            var correo = (form.querySelector('[name="edit-correo"]').value || '').trim().toLowerCase();
            var telefono = (form.querySelector('[name="edit-telefono"]').value || '').trim();
            var rol = form.querySelector('[name="edit-rol"]').value;
            var estado = form.querySelector('[name="edit-estado"]').value;

            if (!nombre) { alert('El nombre no puede quedar vacío.'); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) { alert('Ingresa un correo válido.'); return; }

            var lista = BioForjaAuth.leerUsuarios() || [];
            for (var i = 0; i < lista.length; i++) {
                if (lista[i].id === id) {
                    if (lista[i].correo.toLowerCase() !== correo && existeCorreoDistinto(lista, id, correo)) {
                        alert('Ya existe otro usuario con ese correo.');
                        return;
                    }
                    var eraActual = lista[i].correo.toLowerCase() === String(usuarioLogueado ? usuarioLogueado.correo : '').toLowerCase();
                    lista[i].nombre = nombre;
                    lista[i].correo = correo;
                    lista[i].telefono = telefono;
                    if (!eraActual) {
                        lista[i].rol = rol;
                        lista[i].estado = estado;
                    }
                }
            }

            BioForjaAuth.guardarUsuarios(lista);
            renderUsuarios();
            form.reset();
            var seccion = document.getElementById('seccion-editar-usuario');
            if (seccion && seccion.querySelector('.aviso-auth')) {
                seccion.querySelector('.aviso-auth').remove();
            }
        });
    }

    function existeCorreoDistinto(lista, id, correo) {
        for (var i = 0; i < lista.length; i++) {
            if (lista[i].id !== id && String(lista[i].correo).toLowerCase() === correo) {
                return true;
            }
        }
        return false;
    }

    /* -----------------------------------------------------
       Pedidos (admin/pedidos.html)
       ----------------------------------------------------- */

    function renderPedidos() {
        var pedidos = BioForjaAuth.leerPedidos() || [];
        var cuerpo = document.getElementById('tabla-pedidos');
        if (!cuerpo) { return; }
        cuerpo.innerHTML = '';

        if (!pedidos.length) {
            var fila = document.createElement('tr');
            var celda = document.createElement('td');
            celda.colSpan = 6;
            celda.textContent = 'No hay pedidos todavía. Cuando un cliente confirme una compra, aparecerá aquí.';
            fila.appendChild(celda);
            cuerpo.appendChild(fila);
            vaciarDetalle();
            return;
        }

        for (var i = pedidos.length - 1; i >= 0; i--) {
            var pedido = pedidos[i];
            var filaPedido = document.createElement('tr');

            crearCelda(filaPedido, pedido.orden);
            crearCelda(filaPedido, pedido.correo || '—');
            crearCelda(filaPedido, pedido.fecha || '—');
            crearCelda(filaPedido, formatearPrecio(pedido.total));
            crearCelda(filaPedido, pedido.estado || 'En preparación');

            var celdaAccion = document.createElement('td');
            var boton = document.createElement('button');
            boton.type = 'button';
            boton.textContent = 'Ver detalle';
            boton.className = 'btn btn-outline-success btn-sm';
            boton.setAttribute('data-detalle', pedido.id);
            celdaAccion.appendChild(boton);
            filaPedido.appendChild(celdaAccion);

            cuerpo.appendChild(filaPedido);
        }
    }

    function vaciarDetalle() {
        var detalle = document.getElementById('detalle-pedido');
        if (!detalle) { return; }
        detalle.innerHTML = '';
        var aviso = document.createElement('p');
        aviso.textContent = 'Selecciona un pedido para ver su detalle.';
        detalle.appendChild(aviso);
    }

    function renderDetalle(id) {
        var pedidos = BioForjaAuth.leerPedidos() || [];
        var pedido = null;
        for (var i = 0; i < pedidos.length; i++) {
            if (pedidos[i].id === id) { pedido = pedidos[i]; break; }
        }
        if (!pedido) { return; }

        var detalle = document.getElementById('detalle-pedido');
        if (!detalle) { return; }
        detalle.innerHTML = '';

        var titulo = document.createElement('h3');
        titulo.textContent = 'Orden N° ' + pedido.orden;
        detalle.appendChild(titulo);

        crearParrafo(detalle, 'Cliente: ' + (pedido.correo || '—'));
        crearParrafo(detalle, 'Fecha: ' + (pedido.fecha || '—'));
        crearParrafo(detalle, 'Despacho: ' + etiquetaDespacho(pedido.despacho));
        crearParrafo(detalle, 'Pago: ' + etiquetaPago(pedido.pago));

        var lista = document.createElement('ul');
        var items = pedido.items || [];
        for (var j = 0; j < items.length; j++) {
            var item = document.createElement('li');
            item.textContent = items[j].cantidad + 'x ' + items[j].titulo + ' — ' + formatearPrecio(items[j].precio * items[j].cantidad);
            lista.appendChild(item);
        }
        detalle.appendChild(lista);

        crearParrafo(detalle, 'Subtotal: ' + formatearPrecio(pedido.subtotal));
        crearParrafo(detalle, 'Costo de envío: ' + formatearPrecio(pedido.costoEnvio));
        var total = document.createElement('p');
        total.innerHTML = '<strong>Total: ' + formatearPrecio(pedido.total) + '</strong>';
        detalle.appendChild(total);

        var filaEstado = document.createElement('p');
        filaEstado.style.display = 'flex';
        filaEstado.style.alignItems = 'center';
        filaEstado.style.gap = '8px';

        var etiqueta = document.createElement('label');
        etiqueta.setAttribute('for', 'estado-pedido');
        etiqueta.textContent = 'Cambiar estado:';

        var select = document.createElement('select');
        select.id = 'estado-pedido';
        select.className = 'form-select w-auto';
        select.setAttribute('data-pedido', pedido.id);
        var opciones = ['En preparación', 'Despachado', 'Entregado', 'Cancelado'];
        for (var k = 0; k < opciones.length; k++) {
            var opcion = document.createElement('option');
            opcion.value = opciones[k];
            opcion.textContent = opciones[k];
            if (opciones[k] === pedido.estado) { opcion.selected = true; }
            select.appendChild(opcion);
        }

        var boton = document.createElement('button');
        boton.type = 'button';
        boton.textContent = 'Guardar estado';
        boton.className = 'btn btn-success btn-sm';
        boton.setAttribute('data-guardar-estado', pedido.id);

        filaEstado.appendChild(etiqueta);
        filaEstado.appendChild(select);
        filaEstado.appendChild(boton);
        detalle.appendChild(filaEstado);
    }

    function crearParrafo(contenedor, texto) {
        var p = document.createElement('p');
        p.textContent = texto;
        contenedor.appendChild(p);
        return p;
    }

    function enlazarPedidos() {
        document.body.addEventListener('click', function (evento) {
            var detalle = evento.target.closest('[data-detalle]');
            if (detalle) {
                renderDetalle(parseInt(detalle.getAttribute('data-detalle'), 10));
                return;
            }

            var guardarEstado = evento.target.closest('[data-guardar-estado]');
            if (guardarEstado) {
                var id = parseInt(guardarEstado.getAttribute('data-guardar-estado'), 10);
                var select = document.getElementById('estado-pedido');
                if (select) {
                    BioForjaAuth.actualizarEstadoPedido(id, select.value);
                    renderPedidos();
                    renderDetalle(id);
                }
            }
        });
    }

    /* -----------------------------------------------------
       Inicialización según la página
       ----------------------------------------------------- */

    function inicializar() {
        if (!window.BioForjaAuth || !window.BioForjaProductos) {
            return;
        }
        usuarioLogueado = BioForjaAuth.leerSesion();

        var ruta = window.location.pathname;

        if (/inventario\.html/.test(ruta)) {
            renderInventario();
            enlazarInventario();
        } else if (/usuarios\.html/.test(ruta)) {
            renderUsuarios();
            enlazarUsuarios();
            enlazarFormularioUsuario();
        } else if (/pedidos\.html/.test(ruta)) {
            renderPedidos();
            enlazarPedidos();
        } else {
            renderPanel();
        }
    }

    document.addEventListener('DOMContentLoaded', inicializar);

})();