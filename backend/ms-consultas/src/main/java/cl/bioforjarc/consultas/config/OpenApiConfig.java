package cl.bioforjarc.consultas.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Documentacion OpenAPI del microservicio de consultas.
 * Swagger UI queda disponible en /swagger-ui.html y el contrato en /v3/api-docs.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI bioforjaOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("BioForjaRC - ms-consultas")
                        .version("1.0.0")
                        .description("Formulario de contacto y gestion de consultas de clientes."));
    }
}
