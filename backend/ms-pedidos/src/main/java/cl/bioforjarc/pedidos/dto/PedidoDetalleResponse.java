package cl.bioforjarc.pedidos.dto;

import cl.bioforjarc.pedidos.model.Pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoDetalleResponse(
        Long id,
        String numeroOrden,
        LocalDateTime fechaCreacion,
        LocalDateTime fechaActualizacion,
        String estado,
        String estadoPago,
        String metodoPago,
        boolean pagoSimulado,
        String referenciaPago,
        LocalDateTime fechaPago,
        String correo,
        String nombre,
        String apellido,
        String telefono,
        String rut,
        String documentoTipo,
        String rutFacturacion,
        String razonSocial,
        String giro,
        String direccion,
        String comuna,
        String regionCodigo,
        String regionNombre,
        String metodoDespacho,
        String metodoDespachoNombre,
        int diasHabiles,
        boolean requiereDireccion,
        BigDecimal subtotal,
        BigDecimal costoEnvio,
        BigDecimal total,
        List<ItemPedidoResponse> items,
        String comprobanteUrl
) {

    public static PedidoDetalleResponse desde(Pedido pedido) {
        return new PedidoDetalleResponse(
                pedido.getId(),
                pedido.getNumeroOrden(),
                pedido.getFechaCreacion(),
                pedido.getFechaActualizacion(),
                pedido.getEstado().getEtiqueta(),
                pedido.getEstadoPago().getEtiqueta(),
                pedido.getMetodoPago().getEtiqueta(),
                pedido.isPagoSimulado(),
                pedido.getReferenciaPago(),
                pedido.getFechaPago(),
                pedido.getCorreo(),
                pedido.getNombre(),
                pedido.getApellido(),
                pedido.getTelefono(),
                pedido.getRut(),
                pedido.getDocumentoTipo().getEtiqueta(),
                pedido.getRutFacturacion(),
                pedido.getRazonSocial(),
                pedido.getGiro(),
                pedido.getDireccion(),
                pedido.getComuna(),
                pedido.getRegionCodigo(),
                pedido.getRegionNombre(),
                pedido.getMetodoDespacho(),
                pedido.getMetodoDespachoNombre(),
                pedido.getDiasHabiles(),
                !"retiro".equalsIgnoreCase(pedido.getMetodoDespacho()),
                pedido.getSubtotal(),
                pedido.getCostoEnvio(),
                pedido.getTotal(),
                pedido.getItems().stream().map(ItemPedidoResponse::desde).toList(),
                "/api/pedidos/" + pedido.getId() + "/comprobante");
    }
}
