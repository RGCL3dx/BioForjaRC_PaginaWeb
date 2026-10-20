package cl.bioforjarc.pedidos.client;

import cl.bioforjarc.pedidos.exception.ServicioNoDisponibleException;
import cl.bioforjarc.pedidos.exception.SolicitudInvalidaException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Traduce errores HTTP de otros microservicios a errores propios del dominio.
 */
final class ClienteHttpSoporte {

    private ClienteHttpSoporte() {
    }

    static RuntimeException traducir(RestClientException ex, String servicio) {
        if (ex instanceof RestClientResponseException respuesta) {
            if (respuesta.getStatusCode().is5xxServerError()) {
                return new ServicioNoDisponibleException(
                        "El servicio de " + servicio + " no está disponible en este momento");
            }
            return new SolicitudInvalidaException(
                    "El servicio de " + servicio + " rechazó la solicitud");
        }
        return new ServicioNoDisponibleException(
                "No fue posible comunicarse con el servicio de " + servicio);
    }
}
