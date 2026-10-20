package cl.bioforjarc.catalogo.repository;

import cl.bioforjarc.catalogo.model.Producto;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long>,
        JpaSpecificationExecutor<Producto> {

    boolean existsByNombreIgnoreCase(String nombre);

    @EntityGraph(attributePaths = {"categoria"})
    Optional<Producto> findByIdAndActivoTrue(Long id);

    @EntityGraph(attributePaths = {"categoria", "imagenes"})
    @Query("select p from Producto p where p.id = :id")
    Optional<Producto> findDetallePorId(@Param("id") Long id);

    long countByActivoTrue();

    long countByActivoFalse();

    long countByStockLessThan(int stock);

    @Query("select coalesce(sum(p.stock), 0) from Producto p where p.activo = true")
    long sumarStockActivo();
}
