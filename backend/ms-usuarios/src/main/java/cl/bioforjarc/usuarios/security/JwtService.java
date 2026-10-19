package cl.bioforjarc.usuarios.security;

import cl.bioforjarc.usuarios.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey clave;
    private final long expiracionSegundos;
    private final String emisor;

    public JwtService(
            @Value("${bioforja.jwt.secret:}") String secreto,
            @Value("${bioforja.jwt.expiracion-segundos:86400}") long expiracionSegundos,
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
        this.expiracionSegundos = expiracionSegundos;
        this.emisor = emisor;
    }

    public String generarToken(Usuario usuario) {
        Instant ahora = Instant.now();
        return Jwts.builder()
                .issuer(emisor)
                .subject(usuario.getCorreo())
                .claim("id", usuario.getId())
                .claim("rol", usuario.getRol().name())
                .claim("nombre", usuario.getNombre() + " " + usuario.getApellido())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plusSeconds(expiracionSegundos)))
                .signWith(clave)
                .compact();
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

    public long getExpiracionSegundos() {
        return expiracionSegundos;
    }
}
