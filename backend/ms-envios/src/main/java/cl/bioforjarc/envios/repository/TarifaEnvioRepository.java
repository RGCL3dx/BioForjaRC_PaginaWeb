package cl.bioforjarc.envios.repository;

import cl.bioforjarc.envios.model.TarifaEnvio;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface TarifaEnvioRepository extends JpaRepository<TarifaEnvio, Long> {

    boolean existsByCodigo(String codigo);

    @EntityGraph(attributePaths = {"region", "metodo"})
    @Query("""
            select t from TarifaEnvio t
            where t.region.codigo = :region
              and t.comuna is null
              and t.metodo.codigo = :metodo
            """)
    Optional<TarifaEnvio> buscarBase(@Param("region") String region,
                                     @Param("metodo") String metodo);

    @EntityGraph(attributePaths = {"region", "comuna", "metodo"})
    @Query("""
            select t from TarifaEnvio t
            where t.region.codigo = :region
              and t.comuna.slug = :comuna
              and t.metodo.codigo = :metodo
            """)
    Optional<TarifaEnvio> buscarComuna(@Param("region") String region,
                                       @Param("comuna") String comuna,
                                       @Param("metodo") String metodo);
}
