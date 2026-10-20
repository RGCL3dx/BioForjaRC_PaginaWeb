package cl.bioforjarc.pedidos.client;

import java.math.BigDecimal;

/**
 * Copia del contrato de /api/productos/{id}/validar de ms-catalogo.
 */
public record ProductoValidado(
        boolean existe,
        Long id,
        String nombre,
        BigDecimal precio,
        int stock,
        boolean activo,
        boolean stockSuficiente,
        int cantidadSolicitada
) {
}
