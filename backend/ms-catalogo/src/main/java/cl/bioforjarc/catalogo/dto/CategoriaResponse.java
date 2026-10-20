package cl.bioforjarc.catalogo.dto;

import cl.bioforjarc.catalogo.model.Categoria;

public record CategoriaResponse(
        Long id,
        String nombre,
        String slug,
        String descripcion
) {

    public static CategoriaResponse desde(Categoria categoria) {
        return new CategoriaResponse(
                categoria.getId(),
                categoria.getNombre(),
                categoria.getSlug(),
                categoria.getDescripcion());
    }
}
