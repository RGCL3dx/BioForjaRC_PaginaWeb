package cl.bioforjarc.pedidos.client;

import cl.bioforjarc.pedidos.exception.ServicioNoDisponibleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class CatalogoClient {

    private final RestClient restClient;
    private final String tokenInterno;

    public CatalogoClient(RestClient.Builder builder,
                          @Value("${bioforja.clientes.catalogo-url}") String baseUrl,
                          @Value("${bioforja.jwt.secret:}") String tokenInterno) {
        this.restClient = builder.baseUrl(baseUrl).build();
        this.tokenInterno = tokenInterno;
    }

    public ProductoValidado validar(Long productoId, int cantidad) {
        try {
            ProductoValidado respuesta = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/productos/{id}/validar")
                            .queryParam("cantidad", cantidad)
                            .build(productoId))
                    .retrieve()
                    .body(ProductoValidado.class);
            if (respuesta == null) {
                throw new ServicioNoDisponibleException(
                        "El servicio de catálogo no entregó una respuesta válida");
            }
            return respuesta;
        } catch (RestClientException ex) {
            throw ClienteHttpSoporte.traducir(ex, "catálogo");
        }
    }

    public void ajustarStock(Long productoId, int cantidad) {
        try {
            restClient.patch()
                    .uri("/api/productos/{id}/stock", productoId)
                    .header("X-Internal-Token", tokenInterno)
                    .body(new AjusteStockRequest(cantidad))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException ex) {
            throw ClienteHttpSoporte.traducir(ex, "catálogo");
        }
    }
}
