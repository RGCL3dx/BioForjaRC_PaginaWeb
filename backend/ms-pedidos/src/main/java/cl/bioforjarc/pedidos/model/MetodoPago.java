package cl.bioforjarc.pedidos.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum MetodoPago {

    TARJETA("tarjeta"),
    TRANSFERENCIA("transferencia");

    private final String etiqueta;

    MetodoPago(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    @JsonValue
    public String getEtiqueta() {
        return etiqueta;
    }

    @JsonCreator
    public static MetodoPago desdeTexto(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El metodo de pago es obligatorio");
        }
        String normalizado = valor.trim().toUpperCase(Locale.ROOT);
        for (MetodoPago metodo : values()) {
            if (metodo.name().equals(normalizado) || metodo.etiqueta.equalsIgnoreCase(valor.trim())) {
                return metodo;
            }
        }
        throw new IllegalArgumentException("Metodo de pago no valido: " + valor);
    }
}
