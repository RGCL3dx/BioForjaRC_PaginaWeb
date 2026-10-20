package cl.bioforjarc.cotizaciones.service;

import cl.bioforjarc.cotizaciones.dto.CotizacionDetalleResponse;
import cl.bioforjarc.cotizaciones.dto.CotizacionRequest;
import cl.bioforjarc.cotizaciones.dto.CotizacionResumenResponse;
import cl.bioforjarc.cotizaciones.dto.PaginaResponse;
import cl.bioforjarc.cotizaciones.dto.PresupuestoRequest;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

public interface CotizacionService {

    CotizacionDetalleResponse crear(CotizacionRequest solicitud, List<MultipartFile> archivos);

    PaginaResponse<CotizacionResumenResponse> listar(String q, String estado,
                                                     LocalDate desde, LocalDate hasta,
                                                     int pagina, int tamano);

    CotizacionDetalleResponse obtener(Long id);

    CotizacionDetalleResponse presupuestar(Long id, PresupuestoRequest solicitud);

    ArchivoDescarga obtenerArchivo(Long archivoId);
}
