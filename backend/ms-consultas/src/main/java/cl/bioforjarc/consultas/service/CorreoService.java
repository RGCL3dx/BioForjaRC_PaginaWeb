package cl.bioforjarc.consultas.service;

import cl.bioforjarc.consultas.model.Consulta;

/**
 * Puerto de notificacion al administrador (HU-05.1). En local no hay SMTP:
 * el correo se escribe en el log. El contrato permite conectar un adaptador
 * SMTP real sin modificar el servicio de consultas.
 */
public interface CorreoService {

    void notificarAdministrador(Consulta consulta);
}
