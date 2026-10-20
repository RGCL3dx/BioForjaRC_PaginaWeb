package cl.bioforjarc.pedidos.client;

/**
 * Datos minimos que ms-pedidos necesita del endpoint interno de usuarios.
 * Los campos rol/estado de la respuesta original se ignoran.
 */
public record UsuarioValidado(
        boolean existe,
        Long id,
        String correo,
        String nombre,
        String apellido,
        boolean activo
) {
}
