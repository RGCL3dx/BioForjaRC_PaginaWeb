package cl.bioforjarc.catalogo.dto;

import cl.bioforjarc.catalogo.model.Producto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Ficha completa del producto (HU-01.4 y edición de HU-08.3).
 */
public record ProductoDetalleResponse(
        Long id,
        String nombre,
        String descripcion,
        BigDecimal precio,
        int stock,
        boolean stockBajo,
        CategoriaResponse categoria,
        String imagen,
        List<String> imagenes,
        String material,
        String dimensiones,
        boolean activo,
        LocalDateTime fechaRegistro,
        LocalDateTime fechaActualizacion
) {

    public static ProductoDetalleResponse desde(Producto producto) {
        String imagen = producto.getImagen();
        List<String> galeria = producto.getImagenes() == null || producto.getImagenes().isEmpty()
                ? List.of(imagen == null || imagen.isBlank()
                        ? ProductoResumenResponse.IMAGEN_POR_DEFECTO : imagen)
                : List.copyOf(producto.getImagenes());

        return new ProductoDetalleResponse(
                producto.getId(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getPrecio(),
                producto.getStock(),
                producto.getStock() < ProductoResumenResponse.UMBRAL_STOCK_BAJO,
                CategoriaResponse.desde(producto.getCategoria()),
                imagen == null || imagen.isBlank()
                        ? ProductoResumenResponse.IMAGEN_POR_DEFECTO : imagen,
                galeria,
                producto.getMaterial(),
                producto.getDimensiones(),
                producto.isActivo(),
                producto.getFechaRegistro(),
                producto.getFechaActualizacion());
    }
}
