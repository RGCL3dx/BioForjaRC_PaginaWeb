package cl.bioforjarc.usuarios.security;

import cl.bioforjarc.usuarios.model.Rol;
import cl.bioforjarc.usuarios.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String SECRETO =
            "secreto-de-pruebas-unitarias-bioforjarc-2026-0123456789";
    private static final String EMISOR = "bioforjarc-ms-usuarios";

    private JwtService jwtService;
    private Usuario usuario;

    @BeforeEach
    void preparar() {
        jwtService = new JwtService(SECRETO, 3600, EMISOR);
        usuario = new Usuario();
        usuario.setId(42L);
        usuario.setNombre("Ana");
        usuario.setApellido("Pérez");
        usuario.setCorreo("ana@correo.cl");
        usuario.setRol(Rol.CLIENTE);
    }

    @Test
    void generaUnTokenConLosClaimsDelUsuario() {
        String token = jwtService.generarToken(usuario);

        assertNotNull(token);
        assertEquals(3, token.split("\\.").length);

        Claims claims = jwtService.parsear(token);
        assertEquals("ana@correo.cl", claims.getSubject());
        assertEquals(EMISOR, claims.getIssuer());
        assertEquals(42L, ((Number) claims.get("id")).longValue());
        assertEquals("CLIENTE", claims.get("rol", String.class));
        assertEquals("Ana Pérez", claims.get("nombre", String.class));
        assertNotNull(claims.getIssuedAt());
        assertNotNull(claims.getExpiration());
    }

    @Test
    void aceptaUnTokenFirmadoConElMismoSecretoYEmisor() {
        String token = jwtService.generarToken(usuario);

        assertTrue(jwtService.esValido(token));
    }

    @Test
    void rechazaUnTokenManipulado() {
        String[] partes = jwtService.generarToken(usuario).split("\\.");
        char primerCaracter = partes[2].charAt(0) == 'A' ? 'B' : 'A';
        String firmaManipulada = primerCaracter + partes[2].substring(1);
        String token = partes[0] + "." + partes[1] + "." + firmaManipulada;

        assertFalse(jwtService.esValido(token));
        assertThrows(JwtException.class, () -> jwtService.parsear(token));
    }

    @Test
    void rechazaUnTokenFirmadoConOtroSecreto() {
        JwtService otroServicio = new JwtService(
                "otro-secreto-distinto-de-pruebas-bioforjarc-2026-987654321", 3600, EMISOR);

        assertFalse(jwtService.esValido(otroServicio.generarToken(usuario)));
    }

    @Test
    void rechazaUnTokenEmitidoPorOtroServicio() {
        JwtService otroEmisor = new JwtService(SECRETO, 3600, "otro-emisor");

        assertFalse(jwtService.esValido(otroEmisor.generarToken(usuario)));
    }

    @Test
    void rechazaUnTokenExpirado() {
        JwtService servicioVencido = new JwtService(SECRETO, -60, EMISOR);
        String token = servicioVencido.generarToken(usuario);

        assertFalse(jwtService.esValido(token));
        assertThrows(ExpiredJwtException.class, () -> jwtService.parsear(token));
    }

    @Test
    void exigeUnSecretoDeAlMenos32Caracteres() {
        assertThrows(IllegalStateException.class, () -> new JwtService("", 3600, EMISOR));
        assertThrows(IllegalStateException.class, () -> new JwtService("   ", 3600, EMISOR));
        assertThrows(IllegalStateException.class, () -> new JwtService("corto", 3600, EMISOR));
    }

    @Test
    void exponeLaExpiracionConfigurada() {
        assertEquals(3600, jwtService.getExpiracionSegundos());
    }
}
