package cl.bioforjarc.cotizaciones.service;

import cl.bioforjarc.cotizaciones.model.Cotizacion;

/**
 * Puerto de notificacion al cliente (HU-04.3). En local se registra el correo
 * en el log; el adaptador SMTP real se conectara en una fase posterior.
 */
public interface CorreoService {

    void enviarPresupuesto(Cotizacion cotizacion, String enlacePago);
}
