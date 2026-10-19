package cl.bioforjarc.usuarios.dto;

import cl.bioforjarc.usuarios.model.EstadoUsuario;
import cl.bioforjarc.usuarios.model.Rol;
import cl.bioforjarc.usuarios.model.Usuario;

/**
 * Respuesta del endpoint interno de validación que consumirá ms-pedidos.
 * No expone datos sensibles.
 */
public record ValidacionUsuarioResponse(
        boolean existe,
        Long id,
        String correo,
        String nombre,
        String apellido,
        Rol rol,
        EstadoUsuario estado,
        boolean activo
) {

    public static ValidacionUsuarioResponse desde(Usuario usuario) {
        return new ValidacionUsuarioResponse(
                true,
                usuario.getId(),
                usuario.getCorreo(),
                usuario.getNombre(),
                usuario.getApellido(),
                usuario.getRol(),
                usuario.getEstado(),
                usuario.getEstado() == EstadoUsuario.ACTIVO
        );
    }

    public static ValidacionUsuarioResponse inexistente(String correo) {
        return new ValidacionUsuarioResponse(false, null, correo, null, null, null, null, false);
    }
}
