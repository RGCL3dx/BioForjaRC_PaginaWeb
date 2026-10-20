package cl.bioforjarc.pedidos.dto;

import java.math.BigDecimal;
import java.util.List;

public record ReporteVentasResponse(
        String desde,
        String hasta,
        BigDecimal totalVentas,
        BigDecimal ticketPromedio,
        long cantidadPedidos,
        long unidadesVendidas,
        List<IngresoPeriodoResponse> ingresosPorDia,
        List<IngresoPeriodoResponse> ingresosPorMes,
        List<ProductoVendidoResponse> topProductos
) {
}
