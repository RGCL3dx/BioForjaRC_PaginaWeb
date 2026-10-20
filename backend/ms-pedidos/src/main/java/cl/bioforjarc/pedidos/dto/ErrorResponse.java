package cl.bioforjarc.pedidos.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String mensaje,
        String ruta,
        Map<String, String> detalles
) {

    public static ErrorResponse de(int status, String error, String mensaje, String ruta) {
        return new ErrorResponse(LocalDateTime.now(), status, error, mensaje, ruta, null);
    }

    public static ErrorResponse deValidacion(int status, String error, String mensaje, String ruta,
                                            Map<String, String> detalles) {
        return new ErrorResponse(LocalDateTime.now(), status, error, mensaje, ruta, detalles);
    }
}
