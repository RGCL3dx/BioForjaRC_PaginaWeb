package cl.bioforjarc.envios.dto;

import cl.bioforjarc.envios.model.MetodoDespacho;

public record MetodoDespachoResponse(
        Long id,
        String codigo,
        String nombre,
        String descripcion,
        boolean requiereDireccion,
        int orden
) {

    public static MetodoDespachoResponse desde(MetodoDespacho metodo) {
        return new MetodoDespachoResponse(
                metodo.getId(),
                metodo.getCodigo(),
                metodo.getNombre(),
                metodo.getDescripcion(),
                metodo.isRequiereDireccion(),
                metodo.getOrden());
    }
}
