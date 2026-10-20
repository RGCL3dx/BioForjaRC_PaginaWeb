package cl.bioforjarc.envios.repository;

import cl.bioforjarc.envios.model.Comuna;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ComunaRepository extends JpaRepository<Comuna, Long> {

    List<Comuna> findByRegion_CodigoOrderByNombreAsc(String codigoRegion);

    List<Comuna> findBySlug(String slug);

    Optional<Comuna> findByRegion_CodigoAndSlug(String codigoRegion, String slug);

    boolean existsByRegion_CodigoAndSlug(String codigoRegion, String slug);
}
