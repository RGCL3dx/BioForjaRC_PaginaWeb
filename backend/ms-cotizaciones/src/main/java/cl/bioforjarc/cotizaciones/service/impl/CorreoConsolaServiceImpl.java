package cl.bioforjarc.cotizaciones.service.impl;

import cl.bioforjarc.cotizaciones.model.Cotizacion;
import cl.bioforjarc.cotizaciones.service.CorreoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Implementacion local de HU-04.3: como no hay servidor SMTP configurado, el
 * correo con el presupuesto y el enlace de pago se escribe en el log. El
 * contrato permite sustituirla por un adaptador SMTP sin tocar el servicio.
 */
@Service
public class CorreoConsolaServiceImpl implements CorreoService {

    private static final Logger log = LoggerFactory.getLogger(CorreoConsolaServiceImpl.class);

    private final String remitente;

    public CorreoConsolaServiceImpl(
            @Value("${bioforja.correo.remitente:no-reply@bioforjarc.cl}") String remitente) {
        this.remitente = remitente;
    }

    @Override
    public void enviarPresupuesto(Cotizacion cotizacion, String enlacePago) {
        BigDecimal monto = cotizacion.getMontoTotal();
        log.info("""
                
                ================= CORREO DE PRESUPUESTO (SIMULADO) =================
                De:          {}
                Para:        {} {} <{}>
                Ticket:      {}
                Monto total: ${}
                Plazo:       {} dias
                Enlace pago: {}
                ====================================================================
                """,
                remitente,
                cotizacion.getNombre(),
                cotizacion.getApellido(),
                cotizacion.getCorreo(),
                cotizacion.getNumeroTicket(),
                monto == null ? "0" : monto.toPlainString(),
                cotizacion.getPlazoEntregaDias(),
                enlacePago);
    }
}
