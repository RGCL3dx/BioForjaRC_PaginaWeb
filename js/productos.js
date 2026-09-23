(function () {
    'use strict';

    var CLAVE = 'bioforjarc-productos';
    var IMAGEN_DEFECTO = '../assets/imagenes/macetero-1.webp';

    function leer() {
        try {
            var datos = window.localStorage.getItem(CLAVE);
            return datos ? JSON.parse(datos) : [];
        } catch (error) {
            return [];
        }
    }

    function guardar(lista) {
        window.localStorage.setItem(CLAVE, JSON.stringify(lista));
    }

    function semilla() {
        return [
            { titulo: 'Macetero clásico', descripcion: 'Diseño atemporal para tus plantas de interior y exterior.', precio: 8990, imagen: '../assets/imagenes/macetero-1.webp', categoria: 'maceteros', stock: 15 },
            { titulo: 'Macetero moderno', descripcion: 'Líneas actuales que combinan con cualquier decoración.', precio: 8990, imagen: '../assets/imagenes/macetero-2.webp', categoria: 'maceteros', stock: 15 },
            { titulo: 'Macetero orgánico', descripcion: 'Acabado natural inspirado en formas del entorno.', precio: 9990, imagen: '../assets/imagenes/macetero-3.jpeg', categoria: 'maceteros', stock: 15 },
            { titulo: 'Macetero minimalista', descripcion: 'Colores neutros y silueta limpia para espacios simples.', precio: 7990, imagen: '../assets/imagenes/macetero-4.webp', categoria: 'maceteros', stock: 15 },
            { titulo: 'Macetero cónico', descripcion: 'Forma cónica estable y de gran resistencia.', precio: 8990, imagen: '../assets/imagenes/macetero-5.jpg', categoria: 'maceteros', stock: 15 },
            { titulo: 'Macetero ecléctico', descripcion: 'Pieza única con personalidad y diseño propio.', precio: 10990, imagen: '../assets/imagenes/macetero-6.webp', categoria: 'maceteros', stock: 15 },
            { titulo: 'Ballena articulada', descripcion: 'Pieza móvil con aletas flexibles para coleccionar.', precio: 12990, imagen: '../assets/imagenes/articulado-ballena.jpg', categoria: 'articulados', stock: 15 },
            { titulo: 'Cocodrilo articulado', descripcion: 'Figura articulada de gran detalle y tamaño.', precio: 12990, imagen: '../assets/imagenes/articulado-cocodrilo.jpg', categoria: 'articulados', stock: 15 },
            { titulo: 'Conejo articulado', descripcion: 'Mascota móvil perfecta para regalos infantiles.', precio: 9990, imagen: '../assets/imagenes/articulado-conejo.webp', categoria: 'articulados', stock: 15 },
            { titulo: 'Lobo articulado', descripcion: 'Pieza imponente con movimiento en cuerpo y cola.', precio: 13990, imagen: '../assets/imagenes/articulado-lobo.jpg', categoria: 'articulados', stock: 15 },
            { titulo: 'Perro articulado', descripcion: 'Compañero movible, ideal para mesas y repisas.', precio: 9990, imagen: '../assets/imagenes/articulado-perro.jpg', categoria: 'articulados', stock: 15 },
            { titulo: 'Pulpo articulado', descripcion: 'Figura de tentáculos flexibles y decoración vibrante.', precio: 11990, imagen: '../assets/imagenes/articulado-pulpo.webp', categoria: 'articulados', stock: 15 },
            { titulo: 'Tablero de botones', descripcion: 'Estimula la motricidad fina con texturas variadas.', precio: 7990, imagen: '../assets/imagenes/sensorial-botones.jpg', categoria: 'sensorial', stock: 15 },
            { titulo: 'Cono sensorial', descripcion: 'Forma ergonómica ideal para el agarre infantil.', precio: 6990, imagen: '../assets/imagenes/sensorial-cono.jpg', categoria: 'sensorial', stock: 15 },
            { titulo: 'Cubo sensorial', descripcion: 'Cubo de caras texturizadas que enfoca la atención.', precio: 7990, imagen: '../assets/imagenes/sensorial-cubo.jpg', categoria: 'sensorial', stock: 15 },
            { titulo: 'Estrella sensorial', descripcion: 'Pieza ligera y colorida para juego y terapia.', precio: 6990, imagen: '../assets/imagenes/sensorial-star.webp', categoria: 'sensorial', stock: 15 },
            { titulo: 'Set de figuras ecológicas', descripcion: 'Colección decorativa hecha 100% con plástico reciclado.', precio: 14990, imagen: '../assets/imagenes/figuras-ecologicas.jpg', categoria: 'figuras', stock: 15 },
            { titulo: 'Figuras ecológicas surtidas', descripcion: 'Piezas variadas con acabados únicos para regalar.', precio: 12990, imagen: '../assets/imagenes/figuras-ecologicas2.jpg', categoria: 'figuras', stock: 15 }
        ];
    }

    function sembrar() {
        if (window.localStorage.getItem(CLAVE)) {
            return;
        }
        var lista = semilla();
        for (var i = 0; i < lista.length; i++) {
            lista[i].id = i + 1;
        }
        guardar(lista);
    }

    function siguienteId(lista) {
        var mayor = 0;
        for (var i = 0; i < lista.length; i++) {
            if (lista[i].id > mayor) {
                mayor = lista[i].id;
            }
        }
        return mayor + 1;
    }

    function agregar(datos) {
        var lista = leer();
        datos.id = siguienteId(lista);
        datos.imagen = datos.imagen && datos.imagen.trim() ? datos.imagen.trim() : IMAGEN_DEFECTO;
        datos.stock = parseInt(datos.stock, 10);
        if (isNaN(datos.stock) || datos.stock < 0) {
            datos.stock = 0;
        }
        datos.precio = parseInt(datos.precio, 10);
        if (isNaN(datos.precio) || datos.precio < 0) {
            datos.precio = 0;
        }
        lista.push(datos);
        guardar(lista);
        return datos;
    }

    function esActivo(producto) {
        return producto && producto.activo !== false;
    }

    function actualizar(id, cambios) {
        var lista = leer();
        for (var i = 0; i < lista.length; i++) {
            if (lista[i].id === id) {
                for (var clave in cambios) {
                    if (cambios.hasOwnProperty(clave)) {
                        lista[i][clave] = cambios[clave];
                    }
                }
                guardar(lista);
                return lista[i];
            }
        }
        return null;
    }

    function eliminar(id) {
        var lista = leer();
        var restante = [];
        for (var i = 0; i < lista.length; i++) {
            if (lista[i].id !== id) {
                restante.push(lista[i]);
            }
        }
        guardar(restante);
    }

    function buscar(id) {
        var lista = leer();
        for (var i = 0; i < lista.length; i++) {
            if (lista[i].id === id) {
                return lista[i];
            }
        }
        return null;
    }

    function formatearPrecio(numero) {
        return '$' + Number(numero || 0).toLocaleString('es-CL');
    }

    function crearTarjeta(producto) {
        var articulo = document.createElement('article');
        articulo.className = 'card card-producto h-100 border-0 shadow-sm';
        articulo.setAttribute('data-id', producto.id);

        var imagen = document.createElement('img');
        imagen.className = 'card-img-top';
        imagen.src = producto.imagen || IMAGEN_DEFECTO;
        imagen.alt = producto.titulo;

        var cuerpo = document.createElement('div');
        cuerpo.className = 'card-body d-flex flex-column text-center';

        var titulo = document.createElement('h3');
        titulo.className = 'card-title h5';
        titulo.textContent = producto.titulo;

        var descripcion = document.createElement('p');
        descripcion.className = 'card-text card-descripcion';
        descripcion.textContent = producto.descripcion || '';

        var precio = document.createElement('p');
        precio.className = 'card-text';
        var fuerte = document.createElement('strong');
        fuerte.textContent = formatearPrecio(producto.precio);
        precio.appendChild(fuerte);

        cuerpo.appendChild(titulo);
        cuerpo.appendChild(descripcion);
        cuerpo.appendChild(precio);

        var stock = document.createElement('p');
        if (producto.stock > 0) {
            stock.className = 'stock-producto';
            stock.textContent = 'Quedan ' + producto.stock + ' unidades';
        } else {
            stock.className = 'stock-producto agotado';
            stock.textContent = 'Agotado';
        }
        cuerpo.appendChild(stock);

        if (producto.stock > 0) {
            var agregar = document.createElement('a');
            agregar.href = 'carrito.html';
            agregar.className = 'btn btn-marca mt-auto mb-2';
            agregar.textContent = 'Agregar al carrito';
            cuerpo.appendChild(agregar);
        } else {
            var agotado = document.createElement('span');
            agotado.className = 'etiqueta-agotado mb-2';
            agotado.textContent = 'Agotado';
            cuerpo.appendChild(agotado);
        }

        var cotizar = document.createElement('a');
        cotizar.href = 'cotizacion.html';
        cotizar.className = 'btn btn-marca-outline';
        cotizar.textContent = 'Cotizar';
        cuerpo.appendChild(cotizar);

        articulo.appendChild(imagen);
        articulo.appendChild(cuerpo);

        return articulo;
    }

    function renderizarCatalogo() {
        var lista = leer();
        var contenedores = document.querySelectorAll('[data-categoria]');
        for (var i = 0; i < contenedores.length; i++) {
            contenedores[i].innerHTML = '';
        }

        for (var j = 0; j < lista.length; j++) {
            if (!esActivo(lista[j])) {
                continue;
            }
            var contenedor = document.querySelector('[data-categoria="' + lista[j].categoria + '"]');
            if (contenedor) {
                contenedor.appendChild(crearTarjeta(lista[j]));
            }
        }
    }

    function inicializar() {
        sembrar();
        if (document.querySelector('[data-categoria]')) {
            renderizarCatalogo();
        }
    }

    document.addEventListener('DOMContentLoaded', inicializar);

    window.BioForjaProductos = {
        leer: leer,
        guardar: guardar,
        agregar: agregar,
        actualizar: actualizar,
        eliminar: eliminar,
        buscar: buscar,
        esActivo: esActivo,
        renderizarCatalogo: renderizarCatalogo,
        formatearPrecio: formatearPrecio
    };

})();