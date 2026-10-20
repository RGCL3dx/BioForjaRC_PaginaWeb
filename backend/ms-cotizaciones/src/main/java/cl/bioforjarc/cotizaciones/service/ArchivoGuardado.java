package cl.bioforjarc.cotizaciones.service;

import java.time.LocalDateTime;

/**
 * Resultado de guardar un archivo 3D en disco. La ruta es relativa al
 * directorio configurado para que no se expongan rutas absolutas.
 */
public record ArchivoGuardado(
        String nombreOriginal,
        String extension,
        String tipoContenido,
        long tamano,
        String rutaRelativa,
        LocalDateTime fechaCarga
) {
}
