package cl.bioforjarc.envios.dto;

import cl.bioforjarc.envios.model.Comuna;

public record ComunaResponse(
        Long id,
        String nombre,
        String slug
) {

    public static ComunaResponse desde(Comuna comuna) {
        return new ComunaResponse(comuna.getId(), comuna.getNombre(), comuna.getSlug());
    }
}
