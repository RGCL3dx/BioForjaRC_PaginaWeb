package cl.bioforjarc.pedidos.dto;

import java.math.BigDecimal;

public record ProductoVendidoResponse(
        Long productoId,
        String nombre,
        long unidades,
        BigDecimal ingresos
) {
}
