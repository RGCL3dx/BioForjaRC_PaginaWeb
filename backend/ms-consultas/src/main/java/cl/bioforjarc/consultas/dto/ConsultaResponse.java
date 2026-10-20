package cl.bioforjarc.consultas.dto;

import java.time.LocalDateTime;

/**
 * Confirmacion devuelta al usuario que envio la consulta (HU-05.1).
 */
public record ConsultaResponse(
        Long id,
        String nombre,
        String correo,
        String asunto,
        LocalDateTime fechaEnvio,
        String mensajeConfirmacion
) {
}
