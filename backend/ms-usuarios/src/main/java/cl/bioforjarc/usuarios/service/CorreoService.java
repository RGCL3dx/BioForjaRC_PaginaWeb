package cl.bioforjarc.usuarios.service;

import cl.bioforjarc.usuarios.model.Usuario;

/**
 * Puerto de notificación. En local se usa una implementación que escribe el
 * enlace en el log; el envío SMTP real se conectará en una fase posterior.
 */
public interface CorreoService {

    void enviarConfirmacion(Usuario usuario, String token);
}
