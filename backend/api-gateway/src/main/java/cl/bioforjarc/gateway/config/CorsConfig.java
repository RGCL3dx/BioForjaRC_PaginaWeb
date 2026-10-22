package cl.bioforjarc.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

/**
 * Configuración CORS del API Gateway.
 *
 * <p>Las rutas de negocio se reenvían a microservicios que también aplican
 * CORS. Para evitar que el navegador reciba encabezados CORS duplicados, las
 * rutas del Gateway eliminan los encabezados CORS que vienen desde el
 * microservicio y este filtro agrega una sola vez los del origen validado.</p>
 */
@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration configuracion = new CorsConfiguration();

        // Orígenes permitidos: servidor de desarrollo de Vite, vista previa y hosts locales.
        configuracion.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://127.0.0.1:*",
                "http://[::1]:*"
        ));

        configuracion.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuracion.setAllowedHeaders(List.of("*"));
        configuracion.setExposedHeaders(List.of("Content-Disposition"));
        configuracion.setAllowCredentials(true);
        configuracion.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource fuente = new UrlBasedCorsConfigurationSource();
        fuente.registerCorsConfiguration("/**", configuracion);
        return new CorsFilter(fuente);
    }
}
