package cl.bioforjarc.pedidos.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ItemPedidoRequest(

        @NotNull(message = "El producto es obligatorio")
        Long productoId,

        @Min(value = 1, message = "La cantidad minima es 1")
        @Max(value = 999, message = "La cantidad maxima es 999")
        int cantidad
) {
}
