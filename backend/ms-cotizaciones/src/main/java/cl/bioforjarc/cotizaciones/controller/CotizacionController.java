package cl.bioforjarc.cotizaciones.controller;

import cl.bioforjarc.cotizaciones.dto.CotizacionDetalleResponse;
import cl.bioforjarc.cotizaciones.dto.CotizacionRequest;
import cl.bioforjarc.cotizaciones.dto.CotizacionResumenResponse;
import cl.bioforjarc.cotizaciones.dto.PaginaResponse;
import cl.bioforjarc.cotizaciones.dto.PresupuestoRequest;
import cl.bioforjarc.cotizaciones.service.ArchivoDescarga;
import cl.bioforjarc.cotizaciones.service.CotizacionService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/cotizaciones")
@Validated
public class CotizacionController {

    private final CotizacionService cotizacionService;

    public CotizacionController(CotizacionService cotizacionService) {
        this.cotizacionService = cotizacionService;
    }

    /**
     * HU-04.1: formulario publico con archivos .STL/.OBJ de hasta 50 MB.
     * Genera un ticket en estado "Pendiente".
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public CotizacionDetalleResponse crear(
            @Valid @ModelAttribute CotizacionRequest solicitud,
            @RequestParam(value = "archivos", required = false) List<MultipartFile> archivos) {
        return cotizacionService.crear(solicitud, archivos);
    }

    /**
     * HU-04.2: listado administrativo con filtros por texto, estado y fechas.
     */
    @GetMapping
    public PaginaResponse<CotizacionResumenResponse> listar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "0") @Min(0) int pagina,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int tamano) {
        return cotizacionService.listar(q, estado, desde, hasta, pagina, tamano);
    }

    /**
     * HU-04.2: detalle con especificaciones y metadatos de los archivos.
     */
    @GetMapping("/{id}")
    public CotizacionDetalleResponse obtener(@PathVariable Long id) {
        return cotizacionService.obtener(id);
    }

    /**
     * HU-04.2: descarga del archivo 3D original. Solo administradores.
     */
    @GetMapping("/archivos/{archivoId}")
    public ResponseEntity<Resource> descargar(@PathVariable Long archivoId) {
        ArchivoDescarga descarga = cotizacionService.obtenerArchivo(archivoId);

        MediaType tipo;
        try {
            tipo = MediaType.parseMediaType(descarga.tipoContenido());
        } catch (IllegalArgumentException ex) {
            tipo = MediaType.APPLICATION_OCTET_STREAM;
        }
        ContentDisposition disposicion = ContentDisposition.attachment()
                .filename(descarga.nombreOriginal(), StandardCharsets.UTF_8)
                .build();

        return ResponseEntity.ok()
                .contentType(tipo)
                .contentLength(descarga.tamano())
                .header(HttpHeaders.CONTENT_DISPOSITION, disposicion.toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(descarga.recurso());
    }

    /**
     * HU-04.3: asigna monto y plazo, marca la cotizacion como "Presupuestada"
     * y envia (en local, registra en el log) el correo con el enlace de pago.
     */
    @PostMapping("/{id}/presupuesto")
    public CotizacionDetalleResponse presupuestar(@PathVariable Long id,
                                                  @Valid @RequestBody PresupuestoRequest solicitud) {
        return cotizacionService.presupuestar(id, solicitud);
    }
}
