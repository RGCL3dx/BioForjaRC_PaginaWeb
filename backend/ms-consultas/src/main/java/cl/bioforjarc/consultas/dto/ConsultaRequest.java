package cl.bioforjarc.consultas.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Datos del formulario publico de contacto (HU-05.1).
 * El correo y el mensaje son obligatorios; el telefono es opcional.
 */
public record ConsultaRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 3, max = 100, message = "El nombre debe tener entre 3 y 100 caracteres")
        String nombre,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato valido")
        @Size(max = 150, message = "El correo no puede superar los 150 caracteres")
        String correo,

        @Size(max = 30, message = "El telefono no puede superar los 30 caracteres")
        @Pattern(regexp = "^$|^\\+?[0-9\\s-]{8,20}$",
                message = "El telefono no tiene un formato valido")
        String telefono,

        @NotBlank(message = "El asunto es obligatorio")
        @Size(min = 4, max = 120, message = "El asunto debe tener entre 4 y 120 caracteres")
        String asunto,

        @NotBlank(message = "El mensaje es obligatorio")
        @Size(min = 10, max = 2000, message = "El mensaje debe tener entre 10 y 2000 caracteres")
        String mensaje
) {

    /**
     * Normaliza los espacios antes de validar para aceptar datos copiados
     * desde el formulario sin rechazar correos con espacios accidentales.
     */
    public ConsultaRequest {
        nombre = limpiar(nombre);
        correo = limpiar(correo);
        telefono = limpiar(telefono);
        asunto = limpiar(asunto);
        mensaje = limpiar(mensaje);
    }

    private static String limpiar(String valor) {
        return valor == null ? null : valor.trim();
    }
}
