package cl.bioforjarc.consultas.repository;

import cl.bioforjarc.consultas.model.Consulta;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ConsultaRepository extends JpaRepository<Consulta, Long> {
}
