package cl.bioforjarc.pedidos.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

public final class JwtTestUtils {

    private static final String SECRETO = "clave-de-prueba-bioforjarc-1234567890";
    private static final String EMISOR = "bioforjarc-ms-usuarios";

    private JwtTestUtils() {
    }

    public static String tokenCliente() {
        return token("cliente@bioforja.cl", "CLIENTE");
    }

    public static String tokenAdmin() {
        return token("admin@bioforja.cl", "ADMINISTRADOR");
    }

    public static String token(String correo, String rol) {
        SecretKey clave = Keys.hmacShaKeyFor(SECRETO.getBytes(StandardCharsets.UTF_8));
        Instant ahora = Instant.now();
        return Jwts.builder()
                .issuer(EMISOR)
                .subject(correo)
                .claim("id", 1L)
                .claim("rol", rol)
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plusSeconds(3600)))
                .signWith(clave)
                .compact();
    }
}
