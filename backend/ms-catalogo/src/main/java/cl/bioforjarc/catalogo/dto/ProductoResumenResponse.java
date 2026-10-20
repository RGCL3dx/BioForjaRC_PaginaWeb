package cl.bioforjarc.catalogo.dto;

import cl.bioforjarc.catalogo.model.Producto;

import java.math.BigDecimal;

/**
 * Datos que necesita la grilla del catálogo (HU-01.1) y la tabla de
 * inventario (HU-08.1). No carga la galería completa.
 */
public record ProductoResumenResponse(
        Long id,
        String nombre,
        String descripcion,
        BigDecimal precio,
        int stock,
        boolean stockBajo,
        CategoriaResponse categoria,
        String imagen,
        boolean activo
) {

    public static final int UMBRAL_STOCK_BAJO = 5;
    public static final String IMAGEN_POR_DEFECTO = "../assets/imagenes/SINIMAGEN.png";

    public static ProductoResumenResponse desde(Producto producto) {
        String imagen = producto.getImagen();
        return new ProductoResumenResponse(
                producto.getId(),
                producto.getNombre(),
                producto.getDescripcion(),
                producto.getPrecio(),
                producto.getStock(),
                producto.getStock() < UMBRAL_STOCK_BAJO,
                CategoriaResponse.desde(producto.getCategoria()),
                imagen == null || imagen.isBlank() ? IMAGEN_POR_DEFECTO : imagen,
                producto.isActivo());
    }
}
