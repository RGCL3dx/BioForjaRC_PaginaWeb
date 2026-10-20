package cl.bioforjarc.cotizaciones.service.impl;

import cl.bioforjarc.cotizaciones.dto.ArchivoResponse;
import cl.bioforjarc.cotizaciones.dto.CotizacionDetalleResponse;
import cl.bioforjarc.cotizaciones.dto.CotizacionRequest;
import cl.bioforjarc.cotizaciones.dto.CotizacionResumenResponse;
import cl.bioforjarc.cotizaciones.dto.PaginaResponse;
import cl.bioforjarc.cotizaciones.dto.PresupuestoRequest;
import cl.bioforjarc.cotizaciones.exception.RecursoNoEncontradoException;
import cl.bioforjarc.cotizaciones.exception.SolicitudInvalidaException;
import cl.bioforjarc.cotizaciones.model.ArchivoCotizacion;
import cl.bioforjarc.cotizaciones.model.Cotizacion;
import cl.bioforjarc.cotizaciones.model.EstadoCotizacion;
import cl.bioforjarc.cotizaciones.repository.ArchivoCotizacionRepository;
import cl.bioforjarc.cotizaciones.repository.CotizacionRepository;
import cl.bioforjarc.cotizaciones.service.AlmacenArchivosService;
import cl.bioforjarc.cotizaciones.service.ArchivoDescarga;
import cl.bioforjarc.cotizaciones.service.ArchivoGuardado;
import cl.bioforjarc.cotizaciones.service.CorreoService;
import cl.bioforjarc.cotizaciones.service.CotizacionService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class CotizacionServiceImpl implements CotizacionService {

    private static final DateTimeFormatter FECHA_TICKET = DateTimeFormatter.BASIC_ISO_DATE;

    private final CotizacionRepository cotizacionRepository;
    private final ArchivoCotizacionRepository archivoRepository;
    private final AlmacenArchivosService almacenArchivos;
    private final CorreoService correoService;
    private final SecureRandom aleatorio = new SecureRandom();
    private final String urlPagoBase;

    public CotizacionServiceImpl(CotizacionRepository cotizacionRepository,
                                 ArchivoCotizacionRepository archivoRepository,
                                 AlmacenArchivosService almacenArchivos,
                                 CorreoService correoService,
                                 @Value("${bioforja.pago.url-base:http://localhost:5173/pago-cotizacion}")
                                 String urlPagoBase) {
        this.cotizacionRepository = cotizacionRepository;
        this.archivoRepository = archivoRepository;
        this.almacenArchivos = almacenArchivos;
        this.correoService = correoService;
        this.urlPagoBase = urlPagoBase;
    }

    @Override
    @Transactional
    public CotizacionDetalleResponse crear(CotizacionRequest solicitud, List<MultipartFile> archivos) {
        String numeroTicket = generarNumeroTicket();
        List<ArchivoGuardado> guardados = almacenArchivos.guardar(numeroTicket, archivos);

        try {
            Cotizacion cotizacion = new Cotizacion();
            cotizacion.setNumeroTicket(numeroTicket);
            cotizacion.setNombre(solicitud.getNombre().trim());
            cotizacion.setApellido(solicitud.getApellido().trim());
            cotizacion.setCorreo(solicitud.getCorreo().trim().toLowerCase(Locale.ROOT));
            cotizacion.setTelefono(textoOpcional(solicitud.getTelefono()));
            cotizacion.setCategoria(solicitud.getCategoria().trim());
            cotizacion.setCantidad(solicitud.getCantidad());
            cotizacion.setPlazo(textoOpcional(solicitud.getPlazo()));
            cotizacion.setDescripcion(solicitud.getDescripcion().trim());
            cotizacion.setEstado(EstadoCotizacion.PENDIENTE);

            for (ArchivoGuardado guardado : guardados) {
                ArchivoCotizacion archivo = new ArchivoCotizacion();
                archivo.setNombreOriginal(guardado.nombreOriginal());
                archivo.setExtension(guardado.extension());
                archivo.setTipoContenido(guardado.tipoContenido());
                archivo.setTamano(guardado.tamano());
                archivo.setRutaAlmacenada(guardado.rutaRelativa());
                archivo.setFechaCarga(guardado.fechaCarga());
                cotizacion.agregarArchivo(archivo);
            }

            Cotizacion guardada = cotizacionRepository.saveAndFlush(cotizacion);
            return aDetalle(guardada);
        } catch (RuntimeException ex) {
            // Si la base rechaza el ticket o falla el guardado, no dejamos
            // archivos huerfanos en disco.
            almacenArchivos.eliminar(guardados);
            throw ex;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaginaResponse<CotizacionResumenResponse> listar(String q, String estado,
                                                            LocalDate desde, LocalDate hasta,
                                                            int pagina, int tamano) {
        if (pagina < 0) {
            throw new SolicitudInvalidaException("La pagina debe ser mayor o igual a 0");
        }
        if (tamano < 1 || tamano > 100) {
            throw new SolicitudInvalidaException("El tamano de pagina debe estar entre 1 y 100");
        }
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new SolicitudInvalidaException("La fecha desde no puede ser posterior a la fecha hasta");
        }

        EstadoCotizacion estadoFiltro = null;
        if (estado != null && !estado.isBlank()) {
            // Se valida antes de construir el Specification para responder 400
            // en lugar de dejar que el error ocurra dentro de JPA.
            estadoFiltro = EstadoCotizacion.desdeTexto(estado);
        }
        EstadoCotizacion estadoFinal = estadoFiltro;

        Specification<Cotizacion> filtro = (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String patron = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicados.add(cb.or(
                        cb.like(cb.lower(root.get("numeroTicket")), patron),
                        cb.like(cb.lower(root.get("correo")), patron),
                        cb.like(cb.lower(root.get("nombre")), patron),
                        cb.like(cb.lower(root.get("apellido")), patron)));
            }
            if (estadoFinal != null) {
                predicados.add(cb.equal(root.get("estado"), estadoFinal));
            }
            if (desde != null) {
                predicados.add(cb.greaterThanOrEqualTo(root.get("fechaCreacion"), desde.atStartOfDay()));
            }
            if (hasta != null) {
                predicados.add(cb.lessThan(root.get("fechaCreacion"),
                        hasta.plusDays(1).atStartOfDay()));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };

        Pageable paginacion = PageRequest.of(pagina, tamano,
                Sort.by(Sort.Direction.DESC, "fechaCreacion")
                        .and(Sort.by(Sort.Direction.DESC, "id")));
        Page<CotizacionResumenResponse> resultado =
                cotizacionRepository.findAll(filtro, paginacion).map(this::aResumen);
        return PaginaResponse.desde(resultado);
    }

    @Override
    @Transactional(readOnly = true)
    public CotizacionDetalleResponse obtener(Long id) {
        return aDetalle(buscarDetalle(id));
    }

    @Override
    @Transactional
    public CotizacionDetalleResponse presupuestar(Long id, PresupuestoRequest solicitud) {
        if (solicitud.getMontoTotal() == null) {
            throw new SolicitudInvalidaException("El monto total es obligatorio");
        }
        if (solicitud.getPlazoEntregaDias() == null || solicitud.getPlazoEntregaDias() < 1) {
            throw new SolicitudInvalidaException("El plazo de entrega debe ser al menos 1 dia");
        }

        Cotizacion cotizacion = buscarDetalle(id);
        cotizacion.setMontoTotal(solicitud.getMontoTotal().setScale(2, RoundingMode.HALF_UP));
        cotizacion.setPlazoEntregaDias(solicitud.getPlazoEntregaDias());
        cotizacion.setObservacionesPresupuesto(textoOpcional(solicitud.getObservaciones()));
        cotizacion.setEstado(EstadoCotizacion.PRESUPUESTADA);
        cotizacion.setFechaPresupuesto(LocalDateTime.now());
        String enlacePago = construirEnlacePago(cotizacion.getNumeroTicket());
        cotizacion.setEnlacePago(enlacePago);

        Cotizacion guardada = cotizacionRepository.saveAndFlush(cotizacion);
        correoService.enviarPresupuesto(guardada, enlacePago);
        return aDetalle(guardada);
    }

    @Override
    @Transactional(readOnly = true)
    public ArchivoDescarga obtenerArchivo(Long archivoId) {
        ArchivoCotizacion archivo = archivoRepository.findById(archivoId)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe el archivo de cotizacion " + archivoId));
        Resource recurso = almacenArchivos.cargar(archivo.getRutaAlmacenada());
        String tipo = archivo.getTipoContenido();
        if (tipo == null || tipo.isBlank()) {
            tipo = "application/octet-stream";
        }
        return new ArchivoDescarga(recurso, archivo.getNombreOriginal(), tipo, archivo.getTamano());
    }

    private Cotizacion buscarDetalle(Long id) {
        return cotizacionRepository.buscarDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe la cotizacion " + id));
    }

    private String generarNumeroTicket() {
        for (int intento = 0; intento < 20; intento++) {
            String fecha = LocalDate.now().format(FECHA_TICKET);
            String sufijo = String.format(Locale.ROOT, "%06d", aleatorio.nextInt(1_000_000));
            String ticket = "COT-" + fecha + "-" + sufijo;
            if (!cotizacionRepository.existsByNumeroTicket(ticket)) {
                return ticket;
            }
        }
        throw new IllegalStateException("No se pudo generar un numero de ticket unico");
    }

    private String construirEnlacePago(String numeroTicket) {
        String base = urlPagoBase == null || urlPagoBase.isBlank()
                ? "http://localhost:5173/pago-cotizacion"
                : urlPagoBase.trim();
        String separador = base.contains("?") ? "&" : "?";
        return base + separador + "ticket="
                + URLEncoder.encode(numeroTicket, StandardCharsets.UTF_8);
    }

    private String textoOpcional(String valor) {
        if (valor == null) {
            return null;
        }
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }

    private CotizacionResumenResponse aResumen(Cotizacion cotizacion) {
        return new CotizacionResumenResponse(
                cotizacion.getId(),
                cotizacion.getNumeroTicket(),
                cotizacion.getNombre(),
                cotizacion.getApellido(),
                cotizacion.getCorreo(),
                cotizacion.getTelefono(),
                cotizacion.getCategoria(),
                cotizacion.getCantidad(),
                cotizacion.getPlazo(),
                cotizacion.getEstado().getEtiqueta(),
                cotizacion.getFechaCreacion(),
                cotizacion.getArchivos().size(),
                cotizacion.getMontoTotal(),
                cotizacion.getPlazoEntregaDias(),
                cotizacion.getEnlacePago());
    }

    private CotizacionDetalleResponse aDetalle(Cotizacion cotizacion) {
        List<ArchivoResponse> archivos = cotizacion.getArchivos().stream()
                .sorted(Comparator.comparing(ArchivoCotizacion::getId,
                        Comparator.nullsLast(Long::compareTo)))
                .map(this::aArchivo)
                .toList();

        return new CotizacionDetalleResponse(
                cotizacion.getId(),
                cotizacion.getNumeroTicket(),
                cotizacion.getNombre(),
                cotizacion.getApellido(),
                cotizacion.getCorreo(),
                cotizacion.getTelefono(),
                cotizacion.getCategoria(),
                cotizacion.getCantidad(),
                cotizacion.getPlazo(),
                cotizacion.getDescripcion(),
                cotizacion.getEstado().getEtiqueta(),
                cotizacion.getFechaCreacion(),
                cotizacion.getFechaActualizacion(),
                cotizacion.getMontoTotal(),
                cotizacion.getPlazoEntregaDias(),
                cotizacion.getObservacionesPresupuesto(),
                cotizacion.getEnlacePago(),
                cotizacion.getFechaPresupuesto(),
                archivos);
    }

    private ArchivoResponse aArchivo(ArchivoCotizacion archivo) {
        return new ArchivoResponse(
                archivo.getId(),
                archivo.getNombreOriginal(),
                archivo.getExtension(),
                archivo.getTipoContenido(),
                archivo.getTamano(),
                tamanoLegible(archivo.getTamano()),
                archivo.getFechaCarga(),
                "/api/cotizaciones/archivos/" + archivo.getId());
    }

    private String tamanoLegible(long bytes) {
        if (bytes >= 1_048_576L) {
            return String.format(Locale.ROOT, "%.1f MB", bytes / 1_048_576.0);
        }
        if (bytes >= 1_024L) {
            return String.format(Locale.ROOT, "%.1f KB", bytes / 1_024.0);
        }
        return bytes + " B";
    }
}
