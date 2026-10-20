package cl.bioforjarc.catalogo.dto;

import cl.bioforjarc.catalogo.model.Producto;

import java.math.BigDecimal;

/**
 * Respuesta para que ms-pedidos valide un producto antes de confirmar una
 * compra. No modifica stock.
 */
public record ValidacionProductoResponse(
        boolean existe,
        Long id,
        String nombre,
        BigDecimal precio,
        int stock,
        boolean activo,
        boolean stockSuficiente,
        int cantidadSolicitada
) {

    public static ValidacionProductoResponse desde(Producto producto, int cantidadSolicitada) {
        return new ValidacionProductoResponse(
                true,
                producto.getId(),
                producto.getNombre(),
                producto.getPrecio(),
                producto.getStock(),
                producto.isActivo(),
                producto.isActivo() && producto.getStock() >= cantidadSolicitada,
                cantidadSolicitada);
    }

    public static ValidacionProductoResponse inexistente(Long id, int cantidadSolicitada) {
        return new ValidacionProductoResponse(
                false, id, null, null, 0, false, false, cantidadSolicitada);
    }
}
