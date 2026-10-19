package cl.bioforjarc.usuarios.dto;

import cl.bioforjarc.usuarios.model.EstadoUsuario;
import jakarta.validation.constraints.NotNull;

public record EstadoRequest(

        @NotNull(message = "El estado es obligatorio")
        EstadoUsuario estado
) {
}
