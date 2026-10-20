package cl.bioforjarc.pedidos.dto;

import java.math.BigDecimal;

public record IngresoPeriodoResponse(
        String periodo,
        long pedidos,
        BigDecimal monto
) {
}
