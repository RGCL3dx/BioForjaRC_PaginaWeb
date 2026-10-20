package cl.bioforjarc.pedidos.dto;

import cl.bioforjarc.pedidos.model.DetallePedido;

import java.math.BigDecimal;

public record ItemPedidoResponse(
        Long productoId,
        String nombreProducto,
        int cantidad,
        BigDecimal precioUnitario,
        BigDecimal subtotal
) {

    public static ItemPedidoResponse desde(DetallePedido item) {
        return new ItemPedidoResponse(
                item.getProductoId(),
                item.getNombreProducto(),
                item.getCantidad(),
                item.getPrecioUnitario(),
                item.getSubtotal());
    }
}
