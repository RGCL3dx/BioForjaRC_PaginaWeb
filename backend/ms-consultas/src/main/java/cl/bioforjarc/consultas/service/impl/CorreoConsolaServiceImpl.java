package cl.bioforjarc.consultas.service.impl;

import cl.bioforjarc.consultas.model.Consulta;
import cl.bioforjarc.consultas.service.CorreoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Implementacion local de HU-05.1: como no hay servidor SMTP configurado, el
 * correo de aviso al administrador se escribe en el log.
 */
@Service
public class CorreoConsolaServiceImpl implements CorreoService {

    private static final Logger log = LoggerFactory.getLogger(CorreoConsolaServiceImpl.class);

    private final String remitente;
    private final String destinatario;

    public CorreoConsolaServiceImpl(
            @Value("${bioforja.correo.remitente:no-reply@bioforjarc.cl}") String remitente,
            @Value("${bioforja.correo.admin:admin@bioforjarc.cl}") String destinatario) {
        this.remitente = remitente;
        this.destinatario = destinatario;
    }

    @Override
    public void notificarAdministrador(Consulta consulta) {
        log.info("""
                
                ============== CORREO A ADMINISTRADOR (SIMULADO) ==============
                De:       {}
                Para:     {}
                Fecha:    {}
                Consulta: {}
                Nombre:   {}
                Correo:   {}
                Telefono: {}
                Asunto:   {}
                Mensaje:
                {}
                ===============================================================
                """,
                remitente,
                destinatario,
                consulta.getFechaEnvio(),
                consulta.getId(),
                consulta.getNombre(),
                consulta.getCorreo(),
                consulta.getTelefono() == null ? "(no informado)" : consulta.getTelefono(),
                consulta.getAsunto(),
                consulta.getMensaje());
    }
}
