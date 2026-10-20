package cl.bioforjarc.pedidos.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

/**
 * Estados visibles del pedido. Se conservan las etiquetas que usa el
 * frontend actual para que la migracion a React sea directa.
 */
public enum EstadoPedido {

    EN_PREPARACION("En preparación"),
    DESPACHADO("Despachado"),
    ENTREGADO("Entregado"),
    CANCELADO("Cancelado");

    private final String etiqueta;

    EstadoPedido(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    @JsonValue
    public String getEtiqueta() {
        return etiqueta;
    }

    @JsonCreator
    public static EstadoPedido desdeTexto(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El estado del pedido es obligatorio");
        }
        String normalizado = valor.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        for (EstadoPedido estado : values()) {
            if (estado.name().equals(normalizado) || estado.etiqueta.equalsIgnoreCase(valor.trim())) {
                return estado;
            }
        }
        throw new IllegalArgumentException("Estado de pedido no valido: " + valor);
    }
}
