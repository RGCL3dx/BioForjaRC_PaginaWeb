package cl.bioforjarc.cotizaciones.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Locale;

/**
 * Estados del ticket de cotizacion. HU-04.1 exige que nazca "Pendiente" y
 * HU-04.3 que pase a "Presupuestada" al asignar monto y plazo.
 */
public enum EstadoCotizacion {

    PENDIENTE("Pendiente"),
    PRESUPUESTADA("Presupuestada");

    private final String etiqueta;

    EstadoCotizacion(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    @JsonValue
    public String getEtiqueta() {
        return etiqueta;
    }

    @JsonCreator
    public static EstadoCotizacion desdeTexto(String valor) {
        if (valor == null || valor.isBlank()) {
            throw new IllegalArgumentException("El estado de la cotizacion es obligatorio");
        }
        String normalizado = valor.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        for (EstadoCotizacion estado : values()) {
            if (estado.name().equals(normalizado) || estado.etiqueta.equalsIgnoreCase(valor.trim())) {
                return estado;
            }
        }
        throw new IllegalArgumentException("Estado de cotizacion no valido: " + valor);
    }
}
