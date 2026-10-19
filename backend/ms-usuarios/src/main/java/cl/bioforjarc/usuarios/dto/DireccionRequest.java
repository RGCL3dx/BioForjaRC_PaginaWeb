package cl.bioforjarc.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DireccionRequest(

        @NotBlank(message = "La región es obligatoria")
        @Size(max = 100, message = "La región no puede superar 100 caracteres")
        String region,

        @NotBlank(message = "La comuna es obligatoria")
        @Size(max = 100, message = "La comuna no puede superar 100 caracteres")
        String comuna,

        @NotBlank(message = "La calle es obligatoria")
        @Size(max = 150, message = "La calle no puede superar 150 caracteres")
        String calle,

        @NotBlank(message = "El número es obligatorio")
        @Size(max = 20, message = "El número no puede superar 20 caracteres")
        String numero,

        @Size(max = 50, message = "El departamento no puede superar 50 caracteres")
        String departamento,

        @Size(max = 250, message = "La referencia no puede superar 250 caracteres")
        String referencia,

        boolean principal
) {
}
