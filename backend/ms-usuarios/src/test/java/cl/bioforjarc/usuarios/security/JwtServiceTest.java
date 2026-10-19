package cl.bioforjarc.usuarios.security;

import cl.bioforjarc.usuarios.model.EstadoUsuario;
import cl.bioforjarc.usuarios.model.Rol;
import cl.bioforjarc.usuarios.model.Usuario;
import io.jsonwebtoken.Claims;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String SECRETO =
            "secreto-de-pruebas-ms-usuarios-bioforjarc-2026-no-usar-en-produccion";

    @Test
    void generaYValidaTokenConDatosDelUsuario() {
        JwtService jwtService = new JwtService(SECRETO, 3600, "bioforjarc-ms-usuarios");
        Usuario usuario = new Usuario();
        usuario.setId(7L);
        usuario.setNombre("Ana");
        usuario.setApellido("Pérez");
        usuario.setCorreo("ana@correo.cl");
        usuario.setRol(Rol.CLIENTE);
        usuario.setEstado(EstadoUsuario.ACTIVO);

        String token = jwtService.generarToken(usuario);
        Claims claims = jwtService.parsear(token);

        assertEquals("ana@correo.cl", claims.getSubject());
        assertEquals("CLIENTE", claims.get("rol", String.class));
        assertEquals(7, claims.get("id", Number.class).intValue());
        assertEquals("bioforjarc-ms-usuarios", claims.getIssuer());
        assertTrue(jwtService.esValido(token));
    }

    @Test
    void rechazaTokenManipulado() {
        JwtService jwtService = new JwtService(SECRETO, 3600, "bioforjarc-ms-usuarios");
        assertFalse(jwtService.esValido("esto.no.es.un.jwt"));
    }

    @Test
    void fallaSinSecretoConfigurado() {
        assertThrows(IllegalStateException.class, () -> new JwtService("", 3600, "emisor"));
        assertThrows(IllegalStateException.class, () -> new JwtService("corto", 3600, "emisor"));
    }
}
