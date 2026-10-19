package cl.bioforjarc.usuarios.dto;

import cl.bioforjarc.usuarios.model.Rol;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Datos editables por el administrador (HU-02.3) o por el propio usuario.
 * El rol solo puede cambiarlo un administrador; el servicio lo verifica.
 */
public record UsuarioActualizacionRequest(

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

        Rol rol
) {
}
