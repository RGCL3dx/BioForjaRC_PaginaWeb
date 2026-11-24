package cl.bioforjarc.usuarios.security;

import cl.bioforjarc.usuarios.model.Rol;
import cl.bioforjarc.usuarios.model.Usuario;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicBoolean;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtAuthenticationFilterTest {

    private static final String SECRETO =
            "secreto-de-pruebas-unitarias-bioforjarc-2026-0123456789";
    private static final String EMISOR = "bioforjarc-ms-usuarios";

    private JwtService jwtService;
    private JwtAuthenticationFilter filtro;
    private Usuario administrador;

    @BeforeEach
    void preparar() {
        jwtService = new JwtService(SECRETO, 3600, EMISOR);
        filtro = new JwtAuthenticationFilter(jwtService);

        administrador = new Usuario();
        administrador.setId(1L);
        administrador.setNombre("Admin");
        administrador.setApellido("BioForja");
        administrador.setCorreo("admin@bioforjarc.cl");
        administrador.setRol(Rol.ADMINISTRADOR);
    }

    @AfterEach
    void limpiarContexto() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void autenticaUnTokenValidoConSuRol() throws Exception {
        String token = jwtService.generarToken(administrador);
        MockHttpServletRequest request = peticionCon("Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continuo = new AtomicBoolean(false);
        FilterChain cadena = (req, res) -> continuo.set(true);

        filtro.doFilter(request, response, cadena);

        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(autenticacion);
        assertEquals("admin@bioforjarc.cl", autenticacion.getName());
        assertTrue(autenticacion.getAuthorities().stream()
                .anyMatch(autoridad -> "ROLE_ADMINISTRADOR".equals(autoridad.getAuthority())));
        assertTrue(continuo.get());
    }

    @Test
    void ignoraUnTokenInvalidoYContinuaLaCadena() throws Exception {
        MockHttpServletRequest request = peticionCon("Bearer no-es-un-jwt");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continuo = new AtomicBoolean(false);
        FilterChain cadena = (req, res) -> continuo.set(true);

        filtro.doFilter(request, response, cadena);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(continuo.get());
    }

    @Test
    void noAutenticaCuandoNoHayEncabezadoAuthorization() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/usuarios");
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continuo = new AtomicBoolean(false);
        FilterChain cadena = (req, res) -> continuo.set(true);

        filtro.doFilter(request, response, cadena);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(continuo.get());
    }

    @Test
    void noAutenticaUnTokenSinClaimDeRol() throws Exception {
        String tokenSinRol = Jwts.builder()
                .issuer(EMISOR)
                .subject("ana@correo.cl")
                .signWith(Keys.hmacShaKeyFor(SECRETO.getBytes(StandardCharsets.UTF_8)))
                .compact();
        MockHttpServletRequest request = peticionCon("Bearer " + tokenSinRol);
        MockHttpServletResponse response = new MockHttpServletResponse();
        AtomicBoolean continuo = new AtomicBoolean(false);
        FilterChain cadena = (req, res) -> continuo.set(true);

        filtro.doFilter(request, response, cadena);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
        assertTrue(continuo.get());
    }

    private MockHttpServletRequest peticionCon(String autorizacion) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/usuarios");
        request.addHeader(HttpHeaders.AUTHORIZATION, autorizacion);
        return request;
    }
}
