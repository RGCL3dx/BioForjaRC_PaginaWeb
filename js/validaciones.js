(function () {
    'use strict';


    var patronRut = /^\d{1,2}(\.\d{3}){2}-[0-9kK]$/;
    var patronCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var patronLetras = /^[a-zA-ZáéíóúñÁÉÍÓÚÑüÜ ]+$/;

    function definirError(campo, mensaje) {
        var contenedor = campo.closest('p') || campo.parentNode;
        contenedor.classList.add('campo-error');

        var aviso = contenedor.querySelector('.mensaje-error');
        if (!aviso) {
            aviso = document.createElement('small');
            aviso.className = 'mensaje-error';
            contenedor.appendChild(aviso);
        }
        aviso.textContent = mensaje;
        campo.setAttribute('aria-invalid', 'true');
    }

    function limpiarError(campo) {
        var contenedor = campo.closest('p') || campo.parentNode;
        contenedor.classList.remove('campo-error');

        var aviso = contenedor.querySelector('.mensaje-error');
        if (aviso) {
            aviso.remove();
        }
        campo.removeAttribute('aria-invalid');
    }


    function validarNombre(campo) {
        var valor = campo.value.trim();
        if (campo.hasAttribute('required') && !valor) {
            return 'El nombre completo es obligatorio en BioForjaRC.';
        }
        if (valor.length < 3) {
            return 'El nombre debe tener al menos 3 caracteres.';
        }
        if (!patronLetras.test(valor)) {
            return 'El nombre solo puede contener letras y espacios.';
        }
        return '';
    }

    function validarRut(campo) {
        var valor = campo.value.trim();
        if (campo.hasAttribute('required') && !valor) {
            return 'El RUT es obligatorio para crear tu cuenta.';
        }
        if (!patronRut.test(valor)) {
            return 'Formato de RUT inválido. Usa el formato 12.345.678-9.';
        }
        return '';
    }

    function validarCorreo(campo) {
        var valor = campo.value.trim();
        if (campo.hasAttribute('required') && !valor) {
            return 'Necesitamos tu correo para enviarte la confirmación.';
        }
        if (!patronCorreo.test(valor)) {
            return 'Ingresa un correo válido (ej: contacto@bioforjarc.cl).';
        }
        return '';
    }

    function validarTelefono(campo) {
        var valor = campo.value.trim();
        if (campo.hasAttribute('required') && !valor) {
            return 'El teléfono es obligatorio para avanzar.';
        }
        if (!valor) {
            return '';
        }
        /* Acepta +, espacios, guiones y paréntesis (formatos chilenos e internacionales) */
        if (!/^\+?[\d\s\-()]+$/.test(valor)) {
            return 'El teléfono solo puede tener números, espacios, guiones o paréntesis (ej: +56 9 1234 5678).';
        }
        var digitos = valor.replace(/\D/g, '');
        if (digitos.length < 8 || digitos.length > 12) {
            return 'Ingresa un teléfono válido de 8 a 12 dígitos (ej: +56 9 1234 5678).';
        }
        return '';
    }

    function validarClave(campo) {
        var valor = campo.value;
        if (campo.hasAttribute('required') && !valor) {
            return 'Debes crear una contraseña para tu cuenta.';
        }
        if (valor.length < 8) {
            return 'La contraseña debe tener al menos 8 caracteres.';
        }
        if (!/[A-Za-z]/.test(valor) || !/[0-9]/.test(valor)) {
            return 'La contraseña debe combinar letras y números.';
        }
        return '';
    }

    function validarConfirmarClave(campo) {
        var form = campo.form;
        var clave = form.querySelector('#clave');
        var valor = campo.value;
        if (campo.hasAttribute('required') && !valor) {
            return 'Repite tu contraseña para confirmarla.';
        }
        if (clave && clave.value !== valor) {
            return 'Las contraseñas no coinciden. Revísalas por favor.';
        }
        return '';
    }

    function validarTexto(campo, etiqueta, minimo) {
        var valor = campo.value.trim();
        if (campo.hasAttribute('required') && !valor) {
            return 'El campo ' + etiqueta.toLowerCase() + ' no puede quedar vacío.';
        }
        if (valor.length < minimo) {
            return 'Escribe al menos ' + minimo + ' caracteres en ' + etiqueta.toLowerCase() + '.';
        }
        return '';
    }

    function validarSelect(campo, etiqueta) {
        if (campo.hasAttribute('required') && !campo.value) {
            return 'Selecciona un ' + etiqueta.toLowerCase() + ' para continuar.';
        }
        return '';
    }

    function validarCantidad(campo) {
        var valor = campo.value.trim();
        if (!valor) {
            return '';
        }
        if (parseInt(valor, 10) < 1 || isNaN(valor)) {
            return 'La cantidad debe ser al menos 1 unidad.';
        }
        return '';
    }

    function validarCheckbox(campo, etiqueta) {
        if (campo.hasAttribute('required') && !campo.checked) {
            return 'Debes aceptar ' + etiqueta.toLowerCase() + ' para continuar.';
        }
        return '';
    }


    function obtenerMensajeError(campo) {
        var nombre = campo.name || campo.id || '';

        if (nombre === 'nombre') return validarNombre(campo);
        if (nombre === 'rut') return validarRut(campo);
        if (nombre === 'correo') return validarCorreo(campo);
        if (nombre === 'telefono') return validarTelefono(campo);
        if (nombre === 'clave') return validarClave(campo);
        if (nombre === 'clave-confirmar') return validarConfirmarClave(campo);

        if (campo.type === 'checkbox') return validarCheckbox(campo, 'los términos y condiciones');
        if (campo.tagName === 'SELECT') return validarSelect(campo, campo.labels.length ? campo.labels[0].textContent.replace('*', '').trim() : 'opción');
        if (nombre === 'cantidad') return validarCantidad(campo);
        if (nombre === 'asunto') return validarTexto(campo, 'el asunto', 4);
        if (nombre === 'mensaje') return validarTexto(campo, 'el mensaje', 10);
        if (nombre === 'descripcion') return validarTexto(campo, 'la descripción', 10);

        if (campo.hasAttribute('required') && !campo.value.trim()) {
            return 'Este campo es obligatorio.';
        }
        return '';
    }


    function validarCampo(campo) {
        var mensaje = obtenerMensajeError(campo);
        if (mensaje) {
            definirError(campo, mensaje);
        } else {
            limpiarError(campo);
        }
        return !mensaje;
    }

    function validarFormulario(form) {
        var campos = form.querySelectorAll('input, select, textarea');
        var hayError = false;

        for (var i = 0; i < campos.length; i++) {
            if (!validarCampo(campos[i])) {
                hayError = true;
            }
        }
        return !hayError;
    }


    function iniciarValidacion(form) {
        var campos = form.querySelectorAll('input, select, textarea');
        var campo;

        for (var i = 0; i < campos.length; i++) {
            campo = campos[i];

            var validarEnVivo = function (evento) {
                validarCampo(evento.target);
            };

            campo.addEventListener('blur', validarEnVivo);
            campo.addEventListener('input', validarEnVivo);
            campo.addEventListener('change', validarEnVivo);
        }

        form.noValidate = true;

        form.addEventListener('submit', function (evento) {
            if (!validarFormulario(form)) {
                evento.preventDefault();
                var primerError = form.querySelector('.campo-error input, .campo-error select, .campo-error textarea');
                if (primerError) {
                    primerError.focus();
                }
            }
        });

        form.addEventListener('reset', function () {
            var avisos = form.querySelectorAll('.mensaje-error');
            for (var j = 0; j < avisos.length; j++) {
                avisos[j].remove();
            }
            var contenedores = form.querySelectorAll('.campo-error');
            for (var k = 0; k < contenedores.length; k++) {
                contenedores[k].classList.remove('campo-error');
            }
        });
    }

    function inicializarTodo() {
        var formas = document.querySelectorAll('form');
        for (var i = 0; i < formas.length; i++) {
            iniciarValidacion(formas[i]);
        }
    }

    document.addEventListener('DOMContentLoaded', inicializarTodo);

})();