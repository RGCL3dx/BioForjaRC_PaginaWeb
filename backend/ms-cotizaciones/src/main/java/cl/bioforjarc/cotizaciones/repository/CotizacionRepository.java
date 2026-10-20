package cl.bioforjarc.cotizaciones.repository;

import cl.bioforjarc.cotizaciones.model.Cotizacion;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CotizacionRepository extends JpaRepository<Cotizacion, Long>,
        JpaSpecificationExecutor<Cotizacion> {

    boolean existsByNumeroTicket(String numeroTicket);

    @EntityGraph(attributePaths = "archivos")
    @Query("select distinct c from Cotizacion c where c.id = :id")
    Optional<Cotizacion> buscarDetalle(@Param("id") Long id);
}
