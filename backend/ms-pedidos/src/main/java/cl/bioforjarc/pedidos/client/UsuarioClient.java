package cl.bioforjarc.pedidos.client;

import cl.bioforjarc.pedidos.exception.ServicioNoDisponibleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class UsuarioClient {

    private final RestClient restClient;

    public UsuarioClient(RestClient.Builder builder,
                         @Value("${bioforja.clientes.usuarios-url}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    public UsuarioValidado validar(String correo) {
        try {
            UsuarioValidado respuesta = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/usuarios/validar")
                            .queryParam("correo", correo)
                            .build())
                    .retrieve()
                    .body(UsuarioValidado.class);
            if (respuesta == null) {
                throw new ServicioNoDisponibleException(
                        "El servicio de usuarios no entregó una respuesta válida");
            }
            return respuesta;
        } catch (RestClientException ex) {
            throw ClienteHttpSoporte.traducir(ex, "usuarios");
        }
    }
}
