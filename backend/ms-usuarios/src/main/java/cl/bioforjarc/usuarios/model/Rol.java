package cl.bioforjarc.usuarios.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

import java.util.Arrays;

/**
 * Roles admitidos por la plataforma (HU-02.3).
 * Se serializan en minúsculas para mantener compatibilidad con el frontend.
 */
public enum Rol {

    ADMINISTRADOR("administrador"),
    CLIENTE("cliente");

    private final String valor;

    Rol(String valor) {
        this.valor = valor;
    }

    @JsonValue
    public String getValor() {
        return valor;
    }

    @JsonCreator
    public static Rol desdeValor(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        String limpio = valor.trim();
        return Arrays.stream(values())
                .filter(rol -> rol.valor.equalsIgnoreCase(limpio) || rol.name().equalsIgnoreCase(limpio))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Rol inválido: " + valor));
    }
}
