package cl.bioforjarc.usuarios.dto;

import cl.bioforjarc.usuarios.model.Direccion;

public record DireccionResponse(
        Long id,
        String region,
        String comuna,
        String calle,
        String numero,
        String departamento,
        String referencia,
        boolean principal
) {

    public static DireccionResponse desde(Direccion direccion) {
        return new DireccionResponse(
                direccion.getId(),
                direccion.getRegion(),
                direccion.getComuna(),
                direccion.getCalle(),
                direccion.getNumero(),
                direccion.getDepartamento(),
                direccion.getReferencia(),
                direccion.isPrincipal()
        );
    }
}
