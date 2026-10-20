package cl.bioforjarc.cotizaciones.repository;

import cl.bioforjarc.cotizaciones.model.ArchivoCotizacion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArchivoCotizacionRepository extends JpaRepository<ArchivoCotizacion, Long> {
}
