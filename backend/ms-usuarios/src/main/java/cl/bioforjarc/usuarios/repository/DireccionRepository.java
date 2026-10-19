package cl.bioforjarc.usuarios.repository;

import cl.bioforjarc.usuarios.model.Direccion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DireccionRepository extends JpaRepository<Direccion, Long> {

    List<Direccion> findByUsuarioIdOrderByPrincipalDescIdAsc(Long usuarioId);

    Optional<Direccion> findByIdAndUsuarioId(Long id, Long usuarioId);

    Optional<Direccion> findFirstByUsuarioIdAndPrincipalTrue(Long usuarioId);

    long countByUsuarioId(Long usuarioId);
}
