package cl.bioforjarc.usuarios.repository;

import cl.bioforjarc.usuarios.model.Usuario;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    @EntityGraph(attributePaths = "direcciones")
    Optional<Usuario> findByCorreoIgnoreCase(String correo);

    @EntityGraph(attributePaths = "direcciones")
    Optional<Usuario> findById(Long id);

    boolean existsByCorreoIgnoreCase(String correo);

    @EntityGraph(attributePaths = "direcciones")
    Optional<Usuario> findByTokenConfirmacion(String tokenConfirmacion);

    @EntityGraph(attributePaths = "direcciones")
    List<Usuario> findAllByOrderByFechaRegistroDesc();

    @EntityGraph(attributePaths = "direcciones")
    List<Usuario> findByCorreoContainingIgnoreCaseOrNombreContainingIgnoreCaseOrApellidoContainingIgnoreCaseOrderByFechaRegistroDesc(
            String correo, String nombre, String apellido);
}
