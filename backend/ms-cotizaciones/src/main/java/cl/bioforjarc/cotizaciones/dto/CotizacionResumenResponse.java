package cl.bioforjarc.cotizaciones.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Fila del listado administrativo de cotizaciones.
 */
public record CotizacionResumenResponse(
        Long id,
        String numeroTicket,
        String nombre,
        String apellido,
        String correo,
        String telefono,
        String categoria,
        Integer cantidad,
        String plazo,
        String estado,
        LocalDateTime fechaCreacion,
        int cantidadArchivos,
        BigDecimal montoTotal,
        Integer plazoEntregaDias,
        String enlacePago
) {
}
