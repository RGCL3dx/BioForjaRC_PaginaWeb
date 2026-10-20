package cl.bioforjarc.pedidos.dto;

import cl.bioforjarc.pedidos.model.EstadoPedido;
import jakarta.validation.constraints.NotNull;

public record EstadoPedidoRequest(

        @NotNull(message = "El estado es obligatorio")
        EstadoPedido estado
) {
}
