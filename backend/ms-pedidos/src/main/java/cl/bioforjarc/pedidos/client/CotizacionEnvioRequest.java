package cl.bioforjarc.pedidos.client;

import java.math.BigDecimal;

public record CotizacionEnvioRequest(
        String regionCodigo,
        String comuna,
        String metodoCodigo,
        BigDecimal subtotal
) {
}
