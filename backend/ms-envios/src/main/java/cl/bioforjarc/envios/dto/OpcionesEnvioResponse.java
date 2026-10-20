package cl.bioforjarc.envios.dto;

import java.math.BigDecimal;
import java.util.List;

public record OpcionesEnvioResponse(
        String regionCodigo,
        String regionNombre,
        String comuna,
        BigDecimal subtotal,
        List<OpcionEnvioResponse> opciones
) {
}
