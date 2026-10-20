package cl.bioforjarc.envios.dto;

import java.math.BigDecimal;

/**
 * Resultado de cotizar un método de despacho. Incluye el desglose que exige
 * HU-06.1: subtotal de productos, costo de envío y total a pagar.
 */
public record CotizacionResponse(
        String regionCodigo,
        String regionNombre,
        String comuna,
        String metodoCodigo,
        String metodoNombre,
        String metodoDescripcion,
        BigDecimal subtotal,
        BigDecimal costoEnvio,
        BigDecimal total,
        int diasHabiles,
        boolean requiereDireccion,
        String origenTarifa
) {
}
