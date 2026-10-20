package cl.bioforjarc.envios.repository;

import cl.bioforjarc.envios.model.Region;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegionRepository extends JpaRepository<Region, Long> {

    Optional<Region> findByCodigoIgnoreCase(String codigo);

    boolean existsByCodigoIgnoreCase(String codigo);

    List<Region> findAllByOrderByOrdenAsc();
}
