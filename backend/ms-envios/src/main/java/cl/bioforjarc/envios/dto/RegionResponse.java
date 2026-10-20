package cl.bioforjarc.envios.dto;

import cl.bioforjarc.envios.model.Comuna;
import cl.bioforjarc.envios.model.Region;

import java.util.List;

public record RegionResponse(
        Long id,
        String codigo,
        String nombre,
        List<ComunaResponse> comunas
) {

    public static RegionResponse desde(Region region, List<Comuna> comunas) {
        return new RegionResponse(
                region.getId(),
                region.getCodigo(),
                region.getNombre(),
                comunas.stream().map(ComunaResponse::desde).toList());
    }
}
