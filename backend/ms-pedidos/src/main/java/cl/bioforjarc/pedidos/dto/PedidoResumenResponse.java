package cl.bioforjarc.pedidos.dto;

import cl.bioforjarc.pedidos.model.Pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PedidoResumenResponse(
        Long id,
        String numeroOrden,
        LocalDateTime fechaCreacion,
        String correo,
        String cliente,
        BigDecimal total,
        String estado,
        String estadoPago,
        String metodoPago,
        String metodoDespacho,
        int cantidadProductos,
        String comprobanteUrl
) {

    public static PedidoResumenResponse desde(Pedido pedido) {
        int unidades = pedido.getItems().stream()
                .mapToInt(item -> item.getCantidad())
                .sum();
        return new PedidoResumenResponse(
                pedido.getId(),
                pedido.getNumeroOrden(),
                pedido.getFechaCreacion(),
                pedido.getCorreo(),
                pedido.getNombre() + " " + pedido.getApellido(),
                pedido.getTotal(),
                pedido.getEstado().getEtiqueta(),
                pedido.getEstadoPago().getEtiqueta(),
                pedido.getMetodoPago().getEtiqueta(),
                pedido.getMetodoDespachoNombre(),
                unidades,
                "/api/pedidos/" + pedido.getId() + "/comprobante");
    }
}
