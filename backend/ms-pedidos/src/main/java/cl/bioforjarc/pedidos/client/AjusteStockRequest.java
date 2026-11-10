package cl.bioforjarc.pedidos.client;

/** Delta de inventario: negativo para descontar y positivo para reponer. */
public record AjusteStockRequest(int cantidad) {
}
