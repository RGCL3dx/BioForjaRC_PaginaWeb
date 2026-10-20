package cl.bioforjarc.envios.dto;

import java.math.BigDecimal;

/**
 * Una alternativa de despacho con su costo ya calculado para la ubicación.
 * Permite que el checkout actualice el total al cambiar de opción (HU-06.2).
 */
public record OpcionEnvioResponse(
        String metodoCodigo,
        String metodoNombre,
        String metodoDescripcion,
        BigDecimal costoEnvio,
        BigDecimal total,
        int diasHabiles,
        boolean requiereDireccion,
        String origenTarifa
) {
}
