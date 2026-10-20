package cl.bioforjarc.cotizaciones.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Detalle completo de una cotizacion, incluidas las especificaciones enviadas
 * y los archivos 3D descargables (HU-04.2).
 */
public record CotizacionDetalleResponse(
        Long id,
        String numeroTicket,
        String nombre,
        String apellido,
        String correo,
        String telefono,
        String categoria,
        Integer cantidad,
        String plazo,
        String descripcion,
        String estado,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion,
        BigDecimal montoTotal,
        Integer plazoEntregaDias,
        String observacionesPresupuesto,
        String enlacePago,
        LocalDateTime fechaPresupuesto,
        List<ArchivoResponse> archivos
) {
}
