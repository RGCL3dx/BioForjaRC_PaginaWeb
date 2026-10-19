package cl.bioforjarc.usuarios.service.impl;

import cl.bioforjarc.usuarios.model.Usuario;
import cl.bioforjarc.usuarios.service.CorreoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Implementación local: no hay servidor SMTP configurado en el entorno de
 * desarrollo, por lo que el enlace de confirmación se registra en el log.
 * El contrato permite sustituirla por un adaptador SMTP sin tocar el servicio.
 */
@Service
public class CorreoConsolaServiceImpl implements CorreoService {

    private static final Logger log = LoggerFactory.getLogger(CorreoConsolaServiceImpl.class);

    private final String urlBase;
    private final String remitente;

    public CorreoConsolaServiceImpl(
            @Value("${bioforja.correo.url-base:http://localhost:8090}") String urlBase,
            @Value("${bioforja.correo.remitente:no-reply@bioforjarc.cl}") String remitente) {
        this.urlBase = urlBase;
        this.remitente = remitente;
    }

    @Override
    public void enviarConfirmacion(Usuario usuario, String token) {
        String enlace = urlBase + "/api/auth/confirmar?token=" + token;
        log.info("Correo de confirmación (remitente {}). Para {}: {}",
                remitente, usuario.getCorreo(), enlace);
    }
}
