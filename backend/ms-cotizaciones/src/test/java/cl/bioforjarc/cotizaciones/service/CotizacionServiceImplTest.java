package cl.bioforjarc.cotizaciones.service;

import cl.bioforjarc.cotizaciones.dto.CotizacionDetalleResponse;
import cl.bioforjarc.cotizaciones.dto.CotizacionRequest;
import cl.bioforjarc.cotizaciones.dto.PresupuestoRequest;
import cl.bioforjarc.cotizaciones.exception.RecursoNoEncontradoException;
import cl.bioforjarc.cotizaciones.exception.SolicitudInvalidaException;
import cl.bioforjarc.cotizaciones.model.Cotizacion;
import cl.bioforjarc.cotizaciones.model.EstadoCotizacion;
import cl.bioforjarc.cotizaciones.repository.ArchivoCotizacionRepository;
import cl.bioforjarc.cotizaciones.repository.CotizacionRepository;
import cl.bioforjarc.cotizaciones.service.impl.CotizacionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.mock.web.MockMultipartFile;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CotizacionServiceImplTest {

    private static final String TICKET = "COT-20261019-000010";

    @Mock
    private CotizacionRepository cotizacionRepository;

    @Mock
    private ArchivoCotizacionRepository archivoRepository;

    @Mock
    private AlmacenArchivosService almacenArchivos;

    @Mock
    private CorreoService correoService;

    private CotizacionServiceImpl servicio;

    @BeforeEach
    void preparar() {
        servicio = new CotizacionServiceImpl(cotizacionRepository, archivoRepository,
                almacenArchivos, correoService, "https://pago.test/cotizacion");
    }

    @Test
    void creaTicketPendienteConArchivos() {
        when(cotizacionRepository.existsByNumeroTicket(anyString())).thenReturn(false);
        when(almacenArchivos.guardar(anyString(), anyList())).thenAnswer(invocacion -> {
            String ticket = invocacion.getArgument(0);
            return List.of(new ArchivoGuardado("pieza.stl", "stl", "model/stl", 5,
                    ticket + "/archivo.stl", LocalDateTime.now()));
        });
        when(cotizacionRepository.saveAndFlush(any(Cotizacion.class))).thenAnswer(invocacion -> {
            Cotizacion cotizacion = invocacion.getArgument(0);
            cotizacion.setId(5L);
            return cotizacion;
        });

        CotizacionDetalleResponse respuesta = servicio.crear(solicitudValida(), List.of(
                new MockMultipartFile("archivos", "pieza.stl", "model/stl",
                        "solid".getBytes(StandardCharsets.UTF_8))));

        assertEquals("Pendiente", respuesta.estado());
        assertTrue(respuesta.numeroTicket().matches("COT-\\d{8}-\\d{6}"));
        assertEquals(1, respuesta.archivos().size());
        assertEquals("pieza.stl", respuesta.archivos().get(0).nombreOriginal());
        verify(almacenArchivos).guardar(eq(respuesta.numeroTicket()), anyList());
    }

    @Test
    void eliminaArchivosSiFallaElGuardadoEnBase() {
        when(cotizacionRepository.existsByNumeroTicket(anyString())).thenReturn(false);
        List<ArchivoGuardado> guardados = List.of(new ArchivoGuardado(
                "pieza.stl", "stl", "model/stl", 5, TICKET + "/archivo.stl", LocalDateTime.now()));
        when(almacenArchivos.guardar(anyString(), anyList())).thenReturn(guardados);
        when(cotizacionRepository.saveAndFlush(any(Cotizacion.class)))
                .thenThrow(new DataIntegrityViolationException("duplicado"));

        assertThrows(DataIntegrityViolationException.class,
                () -> servicio.crear(solicitudValida(), List.of()));

        verify(almacenArchivos).eliminar(guardados);
    }

    @Test
    void presupuestaAsignaMontoPlazoEnlaceYNotifica() {
        Cotizacion cotizacion = cotizacionPendiente();
        when(cotizacionRepository.buscarDetalle(10L)).thenReturn(Optional.of(cotizacion));
        when(cotizacionRepository.saveAndFlush(any(Cotizacion.class)))
                .thenAnswer(invocacion -> invocacion.getArgument(0));

        PresupuestoRequest presupuesto = new PresupuestoRequest();
        presupuesto.setMontoTotal(new BigDecimal("12345.678"));
        presupuesto.setPlazoEntregaDias(7);
        presupuesto.setObservaciones("  incluye post procesado  ");

        CotizacionDetalleResponse respuesta = servicio.presupuestar(10L, presupuesto);

        assertEquals("Presupuestada", respuesta.estado());
        assertEquals(new BigDecimal("12345.68"), respuesta.montoTotal());
        assertEquals(7, respuesta.plazoEntregaDias());
        assertEquals("incluye post procesado", respuesta.observacionesPresupuesto());
        assertTrue(respuesta.enlacePago()
                .startsWith("https://pago.test/cotizacion?ticket=" + TICKET));
        assertTrue(respuesta.fechaPresupuesto() != null);
        verify(correoService).enviarPresupuesto(cotizacion, respuesta.enlacePago());
    }

    @Test
    void presupuestarCotizacionInexistenteDevuelveNoEncontrado() {
        when(cotizacionRepository.buscarDetalle(99L)).thenReturn(Optional.empty());

        PresupuestoRequest presupuesto = new PresupuestoRequest();
        presupuesto.setMontoTotal(new BigDecimal("1000"));
        presupuesto.setPlazoEntregaDias(5);

        assertThrows(RecursoNoEncontradoException.class,
                () -> servicio.presupuestar(99L, presupuesto));
        verify(correoService, never()).enviarPresupuesto(any(), anyString());
    }

    @Test
    void presupuestoExigeMontoYPlazo() {
        PresupuestoRequest sinMonto = new PresupuestoRequest();
        sinMonto.setPlazoEntregaDias(5);

        assertThrows(SolicitudInvalidaException.class,
                () -> servicio.presupuestar(10L, sinMonto));

        PresupuestoRequest sinPlazo = new PresupuestoRequest();
        sinPlazo.setMontoTotal(new BigDecimal("1000"));

        assertThrows(SolicitudInvalidaException.class,
                () -> servicio.presupuestar(10L, sinPlazo));
    }

    @Test
    void listadoRechazaPaginacionInvalida() {
        assertThrows(SolicitudInvalidaException.class,
                () -> servicio.listar(null, null, null, null, -1, 20));
        assertThrows(SolicitudInvalidaException.class,
                () -> servicio.listar(null, null, null, null, 0, 0));
        assertThrows(SolicitudInvalidaException.class,
                () -> servicio.listar(null, null, null, null, 0, 101));
        assertThrows(SolicitudInvalidaException.class,
                () -> servicio.listar(null, null, LocalDate.of(2026, 10, 20),
                        LocalDate.of(2026, 10, 10), 0, 20));
    }

    @Test
    void descargaArchivoInexistenteDevuelveNoEncontrado() {
        when(archivoRepository.findById(7L)).thenReturn(Optional.empty());

        assertThrows(RecursoNoEncontradoException.class,
                () -> servicio.obtenerArchivo(7L));
    }

    private CotizacionRequest solicitudValida() {
        CotizacionRequest solicitud = new CotizacionRequest();
        solicitud.setNombre("Ana");
        solicitud.setApellido("Perez");
        solicitud.setCorreo("Ana.Perez@Correo.CL");
        solicitud.setTelefono("+56 9 1234 5678");
        solicitud.setCategoria("figuras");
        solicitud.setCantidad(2);
        solicitud.setPlazo("2");
        solicitud.setDescripcion("Figura articulada personalizada de una ballena");
        return solicitud;
    }

    private Cotizacion cotizacionPendiente() {
        Cotizacion cotizacion = new Cotizacion();
        cotizacion.setId(10L);
        cotizacion.setNumeroTicket(TICKET);
        cotizacion.setNombre("Ana");
        cotizacion.setApellido("Perez");
        cotizacion.setCorreo("ana@correo.cl");
        cotizacion.setCategoria("figuras");
        cotizacion.setDescripcion("Figura articulada personalizada de una ballena");
        cotizacion.setEstado(EstadoCotizacion.PENDIENTE);
        cotizacion.setFechaCreacion(LocalDateTime.now());
        return cotizacion;
    }
}
