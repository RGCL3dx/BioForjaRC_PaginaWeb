package cl.bioforjarc.pedidos.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

/**
 * Verifica los JWT emitidos por ms-usuarios. ms-pedidos no emite tokens.
 */
@Service
public class JwtService {

    private final SecretKey clave;
    private final String emisor;

    public JwtService(
            @Value("${bioforja.jwt.secret:}") String secreto,
            @Value("${bioforja.jwt.emisor:bioforjarc-ms-usuarios}") String emisor) {

        if (secreto == null || secreto.isBlank()) {
            throw new IllegalStateException(
                    "Falta BIOFORJA_JWT_SECRET: configure un secreto de al menos 32 caracteres");
        }
        byte[] bytes = secreto.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) {
            throw new IllegalStateException(
                    "BIOFORJA_JWT_SECRET debe tener al menos 32 caracteres para firmar con HMAC");
        }
        this.clave = Keys.hmacShaKeyFor(bytes);
        this.emisor = emisor;
    }

    public Claims parsear(String token) {
        return Jwts.parser()
                .verifyWith(clave)
                .require("iss", emisor)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean esValido(String token) {
        try {
            parsear(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            return false;
        }
    }
}
