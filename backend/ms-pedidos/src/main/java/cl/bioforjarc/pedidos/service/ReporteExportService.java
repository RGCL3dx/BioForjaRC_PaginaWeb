package cl.bioforjarc.pedidos.service;

import cl.bioforjarc.pedidos.dto.ReporteVentasResponse;

public interface ReporteExportService {

    byte[] excel(ReporteVentasResponse reporte);

    byte[] pdf(ReporteVentasResponse reporte);

    String nombreArchivo(ReporteVentasResponse reporte, String extension);
}
