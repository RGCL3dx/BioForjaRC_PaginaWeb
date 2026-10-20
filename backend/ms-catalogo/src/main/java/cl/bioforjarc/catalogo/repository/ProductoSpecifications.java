package cl.bioforjarc.catalogo.repository;

import cl.bioforjarc.catalogo.model.Producto;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Filtros combinables del catálogo: texto, categorías, material y estado.
 */
public final class ProductoSpecifications {

    private ProductoSpecifications() {
    }

    public static Specification<Producto> filtros(String busqueda, List<String> categorias,
                                                   String material, Boolean activo) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();

            if (activo != null) {
                predicados.add(cb.equal(root.get("activo"), activo));
            }

            if (busqueda != null && !busqueda.isBlank()) {
                String patron = "%" + busqueda.trim().toLowerCase(Locale.ROOT) + "%";
                predicados.add(cb.or(
                        cb.like(cb.lower(root.get("nombre")), patron),
                        cb.like(cb.lower(root.get("descripcion")), patron)));
            }

            if (categorias != null && !categorias.isEmpty()) {
                List<String> slugs = categorias.stream()
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .filter(slug -> !slug.isBlank())
                        .map(slug -> slug.toLowerCase(Locale.ROOT))
                        .toList();
                if (!slugs.isEmpty()) {
                    predicados.add(root.get("categoria").get("slug").in(slugs));
                }
            }

            if (material != null && !material.isBlank()) {
                String patronMaterial = "%" + material.trim().toLowerCase(Locale.ROOT) + "%";
                predicados.add(cb.like(cb.lower(root.get("material")), patronMaterial));
            }

            return cb.and(predicados.toArray(Predicate[]::new));
        };
    }
}
