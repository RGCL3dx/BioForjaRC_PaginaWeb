package cl.bioforjarc.usuarios.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Datos de entrada para HU-02.1 (registro de cuenta).
 * La confirmación de contraseña se valida en el frontend; aquí solo se exige
 * una clave que cumpla la política mínima.
 */
public record RegistroRequest(

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 80, message = "El nombre no puede superar 80 caracteres")
        String nombre,

        @NotBlank(message = "El apellido es obligatorio")
        @Size(max = 80, message = "El apellido no puede superar 80 caracteres")
        String apellido,

        @NotBlank(message = "El RUT es obligatorio")
        @Pattern(regexp = "^\\d{1,2}\\.?\\d{3}\\.?\\d{3}-[\\dKk]$",
                message = "El RUT debe tener el formato 12.345.678-9")
        String rut,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        @Size(max = 150, message = "El correo no puede superar 150 caracteres")
        String correo,

        @Pattern(regexp = "^$|^[+0-9 ()-]{0,25}$", message = "El teléfono contiene caracteres no permitidos")
        @Size(max = 25, message = "El teléfono no puede superar 25 caracteres")
        String telefono,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
                message = "La contraseña debe incluir mayúscula, minúscula y número")
        String clave
) {
}
