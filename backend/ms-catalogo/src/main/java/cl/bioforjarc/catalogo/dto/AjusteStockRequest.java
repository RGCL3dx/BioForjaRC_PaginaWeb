package cl.bioforjarc.catalogo.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Ajuste interno de inventario solicitado por ms-pedidos.
 *
 * <p>{@code cantidad} es un delta: negativa descuenta unidades al confirmar una
 * compra y positiva las repone cuando el pedido se cancela.</p>
 */
public record AjusteStockRequest(

        @NotNull(message = "La cantidad es obligatoria")
        Integer cantidad
) {
}
