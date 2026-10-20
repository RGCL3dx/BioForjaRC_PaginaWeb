package cl.bioforjarc.cotizaciones.service;

import org.springframework.core.io.Resource;

/**
 * Archivo listo para descargar por un administrador (HU-04.2).
 */
public record ArchivoDescarga(
        Resource recurso,
        String nombreOriginal,
        String tipoContenido,
        long tamano
) {
}
