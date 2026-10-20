package cl.bioforjarc.catalogo.dto;

/**
 * Resumen para el panel de inventario (HU-08.1).
 */
public record ResumenInventarioResponse(
        long totalProductos,
        long activos,
        long inactivos,
        long stockBajo,
        long unidadesDisponibles
) {
}
