package cl.bioforjarc.catalogo.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * Datos de entrada para crear o editar un producto (HU-08.2 y HU-08.3).
 */
public record ProductoRequest(

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 150, message = "El nombre no puede superar 150 caracteres")
        String nombre,

        @NotBlank(message = "La descripción es obligatoria")
        @Size(max = 1000, message = "La descripción no puede superar 1000 caracteres")
        String descripcion,

        @NotNull(message = "El precio es obligatorio")
        @DecimalMin(value = "0.01", message = "El precio debe ser mayor que cero")
        @Digits(integer = 10, fraction = 2, message = "El precio admite hasta 10 enteros y 2 decimales")
        BigDecimal precio,

        @NotNull(message = "El stock es obligatorio")
        @Min(value = 0, message = "El stock no puede ser negativo")
        Integer stock,

        @NotBlank(message = "La categoría es obligatoria")
        @Size(max = 60, message = "La categoría no puede superar 60 caracteres")
        String categoriaSlug,

        @Size(max = 120, message = "El material no puede superar 120 caracteres")
        String material,

        @Size(max = 120, message = "Las dimensiones no pueden superar 120 caracteres")
        String dimensiones,

        @NotBlank(message = "La imagen principal es obligatoria")
        @Size(max = 500, message = "La ruta de la imagen no puede superar 500 caracteres")
        String imagen,

        @Size(max = 8, message = "Se permiten como máximo 8 imágenes")
        List<@NotBlank(message = "Una imagen de la galería está vacía")
             @Size(max = 500, message = "La ruta de una imagen no puede superar 500 caracteres")
             String> imagenes
) {
}
