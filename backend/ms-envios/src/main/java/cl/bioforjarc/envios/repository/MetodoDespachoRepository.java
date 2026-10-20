package cl.bioforjarc.envios.repository;

import cl.bioforjarc.envios.model.MetodoDespacho;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MetodoDespachoRepository extends JpaRepository<MetodoDespacho, Long> {

    Optional<MetodoDespacho> findByCodigoIgnoreCaseAndActivoTrue(String codigo);

    List<MetodoDespacho> findAllByActivoTrueOrderByOrdenAsc();

    boolean existsByCodigoIgnoreCase(String codigo);
}
