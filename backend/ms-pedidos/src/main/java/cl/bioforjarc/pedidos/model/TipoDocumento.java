package cl.bioforjarc.pedidos.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

public enum TipoDocumento {

    BOLETA("boleta"),
    FACTURA("factura");

    private final String etiqueta;

    TipoDocumento(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    @JsonValue
    public String getEtiqueta() {
        return etiqueta;
    }

    @JsonCreator
    public static TipoDocumento desdeTexto(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El tipo de documento es obligatorio");
        }
        String normalizado = valor.trim().toUpperCase(Locale.ROOT);
        for (TipoDocumento tipo : values()) {
            if (tipo.name().equals(normalizado) || tipo.etiqueta.equalsIgnoreCase(valor.trim())) {
                return tipo;
            }
        }
        throw new IllegalArgumentException("Tipo de documento no valido: " + valor);
    }
}
