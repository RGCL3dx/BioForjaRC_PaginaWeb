package cl.bioforjarc.usuarios.dto;

import cl.bioforjarc.usuarios.model.EstadoUsuario;
import cl.bioforjarc.usuarios.model.Rol;
import cl.bioforjarc.usuarios.model.Usuario;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Representación pública de un usuario. Nunca incluye la contraseña ni su hash.
 */
public record UsuarioResponse(
        Long id,
        String nombre,
        String apellido,
        String rut,
        String correo,
        String telefono,
        Rol rol,
        EstadoUsuario estado,
        LocalDateTime fechaRegistro,
        boolean correoConfirmado,
        List<DireccionResponse> direcciones
) {

    public static UsuarioResponse desde(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getRut(),
                usuario.getCorreo(),
                usuario.getTelefono(),
                usuario.getRol(),
                usuario.getEstado(),
                usuario.getFechaRegistro(),
                usuario.isCorreoConfirmado(),
                usuario.getDirecciones() == null
                        ? List.of()
                        : usuario.getDirecciones().stream().map(DireccionResponse::desde).toList()
        );
    }
}
