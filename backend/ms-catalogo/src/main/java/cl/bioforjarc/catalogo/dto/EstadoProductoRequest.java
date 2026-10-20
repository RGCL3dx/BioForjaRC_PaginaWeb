package cl.bioforjarc.catalogo.dto;

import jakarta.validation.constraints.NotNull;

public record EstadoProductoRequest(

        @NotNull(message = "El estado activo es obligatorio")
        Boolean activo
) {
}
