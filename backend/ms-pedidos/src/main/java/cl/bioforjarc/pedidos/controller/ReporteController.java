package cl.bioforjarc.pedidos.controller;

import cl.bioforjarc.pedidos.dto.ReporteVentasResponse;
import cl.bioforjarc.pedidos.exception.SolicitudInvalidaException;
import cl.bioforjarc.pedidos.service.ReporteExportService;
import cl.bioforjarc.pedidos.service.ReporteService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Locale;

@RestController
@RequestMapping("/api/reportes")
public class ReporteController {

    private final ReporteService reporteService;
    private final ReporteExportService exportService;

    public ReporteController(ReporteService reporteService,
                             ReporteExportService exportService) {
        this.reporteService = reporteService;
        this.exportService = exportService;
    }

    /** HU-09.1: indicadores, ingresos y Top 5 productos. */
    @GetMapping("/ventas")
    public ReporteVentasResponse ventas(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return reporteService.generar(desde, hasta);
    }

    /** HU-09.1: exportación a Excel o PDF con el mismo rango de fechas. */
    @GetMapping("/ventas/exportar")
    public ResponseEntity<byte[]> exportar(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "xlsx") String formato) {

        String formatoLimpio = formato.trim().toLowerCase(Locale.ROOT);
        if (!formatoLimpio.equals("xlsx") && !formatoLimpio.equals("pdf")) {
            throw new SolicitudInvalidaException(
                    "El formato de exportación debe ser xlsx o pdf");
        }

        ReporteVentasResponse reporte = reporteService.generar(desde, hasta);
        byte[] archivo = formatoLimpio.equals("pdf")
                ? exportService.pdf(reporte)
                : exportService.excel(reporte);

        MediaType tipo = formatoLimpio.equals("pdf")
                ? MediaType.APPLICATION_PDF
                : MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(tipo);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(exportService.nombreArchivo(reporte, formatoLimpio), StandardCharsets.UTF_8)
                .build());
        return new ResponseEntity<>(archivo, headers, HttpStatus.OK);
    }
}
