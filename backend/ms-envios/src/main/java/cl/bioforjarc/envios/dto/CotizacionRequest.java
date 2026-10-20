package cl.bioforjarc.envios.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Datos para cotizar un envío (HU-06.1 y HU-06.2).
 *
 * <p>{@code regionCodigo} puede omitirse solo cuando el método es retiro
 * presencial; esa regla se valida en el servicio porque depende del método.</p>
 */
public record CotizacionRequest(

        @Size(max = 40, message = "El código de región no puede superar 40 caracteres")
        String regionCodigo,

        @Size(max = 120, message = "La comuna no puede superar 120 caracteres")
        String comuna,

        @NotBlank(message = "El método de despacho es obligatorio")
        @Size(max = 30, message = "El código del método no puede superar 30 caracteres")
        String metodoCodigo,

        @DecimalMin(value = "0.0", message = "El subtotal no puede ser negativo")
        @Digits(integer = 10, fraction = 2, message = "El subtotal admite hasta 10 enteros y 2 decimales")
        BigDecimal subtotal
) {
}
