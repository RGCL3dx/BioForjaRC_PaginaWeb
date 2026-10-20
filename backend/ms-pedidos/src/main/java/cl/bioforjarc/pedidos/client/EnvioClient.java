package cl.bioforjarc.pedidos.client;

import cl.bioforjarc.pedidos.exception.ServicioNoDisponibleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;

@Component
public class EnvioClient {

    private final RestClient restClient;

    public EnvioClient(RestClient.Builder builder,
                       @Value("${bioforja.clientes.envios-url}") String baseUrl) {
        this.restClient = builder.baseUrl(baseUrl).build();
    }

    public CotizacionEnvio cotizar(String regionCodigo, String comuna,
                                   String metodoCodigo, BigDecimal subtotal) {
        try {
            CotizacionEnvio respuesta = restClient.post()
                    .uri("/api/envios/cotizar")
                    .body(new CotizacionEnvioRequest(regionCodigo, comuna, metodoCodigo, subtotal))
                    .retrieve()
                    .body(CotizacionEnvio.class);
            if (respuesta == null) {
                throw new ServicioNoDisponibleException(
                        "El servicio de envíos no entregó una respuesta válida");
            }
            return respuesta;
        } catch (RestClientException ex) {
            throw ClienteHttpSoporte.traducir(ex, "envíos");
        }
    }
}
