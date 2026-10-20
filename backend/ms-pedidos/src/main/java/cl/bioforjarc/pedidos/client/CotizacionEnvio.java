package cl.bioforjarc.pedidos.client;

import java.math.BigDecimal;

/**
 * Copia del contrato de /api/envios/cotizar de ms-envios.
 */
public record CotizacionEnvio(
        String regionCodigo,
        String regionNombre,
        String comuna,
        String metodoCodigo,
        String metodoNombre,
        BigDecimal subtotal,
        BigDecimal costoEnvio,
        BigDecimal total,
        int diasHabiles,
        boolean requiereDireccion,
        String origenTarifa
) {
}
