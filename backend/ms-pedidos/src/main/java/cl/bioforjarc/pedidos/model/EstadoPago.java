package cl.bioforjarc.pedidos.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum EstadoPago {

    PAGADO("Pagado"),
    PENDIENTE("Pendiente"),
    FALLIDO("Fallido");

    private final String etiqueta;

    EstadoPago(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    @JsonValue
    public String getEtiqueta() {
        return etiqueta;
    }

    @JsonCreator
    public static EstadoPago desdeTexto(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El estado de pago es obligatorio");
        }
        String normalizado = valor.trim().toUpperCase(Locale.ROOT);
        for (EstadoPago estado : values()) {
            if (estado.name().equals(normalizado) || estado.etiqueta.equalsIgnoreCase(valor.trim())) {
                return estado;
            }
        }
        throw new IllegalArgumentException("Estado de pago no valido: " + valor);
    }
}
