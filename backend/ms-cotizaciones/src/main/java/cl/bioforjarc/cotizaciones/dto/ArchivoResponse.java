package cl.bioforjarc.cotizaciones.dto;

import java.time.LocalDateTime;

/**
 * Metadatos de un archivo 3D adjunto (HU-04.2). El binario se descarga desde
 * {@code descargaUrl}, que solo acepta administradores autenticados.
 */
public record ArchivoResponse(
        Long id,
        String nombreOriginal,
        String extension,
        String tipoContenido,
        long tamano,
        String tamanoLegible,
        LocalDateTime fechaCarga,
        String descargaUrl
) {
}
