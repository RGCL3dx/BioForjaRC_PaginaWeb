package cl.bioforjarc.usuarios.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

/**
 * Estado de una cuenta (HU-02.3).
 * Se serializa con la misma forma que usa el frontend actual: Activo / Inactivo.
 */
public enum EstadoUsuario {

    ACTIVO("Activo"),
    INACTIVO("Inactivo");

    private final String valor;

    EstadoUsuario(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static EstadoUsuario desdeValor(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        String limpio = valor.trim();
        return Arrays.stream(values())
                .filter(estado -> estado.valor.equalsIgnoreCase(limpio) || estado.name().equalsIgnoreCase(limpio))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Estado inválido: " + valor));
    }
}
