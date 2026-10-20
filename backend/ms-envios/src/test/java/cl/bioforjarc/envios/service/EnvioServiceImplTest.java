package cl.bioforjarc.envios.service;

import cl.bioforjarc.envios.dto.CotizacionRequest;
import cl.bioforjarc.envios.dto.CotizacionResponse;
import cl.bioforjarc.envios.dto.OpcionesEnvioResponse;
import cl.bioforjarc.envios.dto.RegionResponse;
import cl.bioforjarc.envios.exception.SolicitudInvalidaException;
import cl.bioforjarc.envios.model.Comuna;
import cl.bioforjarc.envios.model.MetodoDespacho;
import cl.bioforjarc.envios.model.Region;
import cl.bioforjarc.envios.model.TarifaEnvio;
import cl.bioforjarc.envios.repository.ComunaRepository;
import cl.bioforjarc.envios.repository.MetodoDespachoRepository;
import cl.bioforjarc.envios.repository.RegionRepository;
import cl.bioforjarc.envios.repository.TarifaEnvioRepository;
import cl.bioforjarc.envios.service.impl.EnvioServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EnvioServiceImplTest {

    @Mock
    private RegionRepository regionRepository;

    @Mock
    private ComunaRepository comunaRepository;

    @Mock
    private MetodoDespachoRepository metodoRepository;

    @Mock
    private TarifaEnvioRepository tarifaRepository;

    private EnvioServiceImpl servicio;

    @BeforeEach
    void preparar() {
        servicio = new EnvioServiceImpl(regionRepository, comunaRepository,
                metodoRepository, tarifaRepository);
    }

    @Test
    void cotizarEstandarMetropolitanaCalculaDesglose() {
        MetodoDespacho estandar = metodo("estandar", "Envío estándar", true, null, 1);
        Region metropolitana = region("metropolitana", "Región Metropolitana", 7);
        when(metodoRepository.findByCodigoIgnoreCaseAndActivoTrue("estandar"))
                .thenReturn(Optional.of(estandar));
        when(regionRepository.findByCodigoIgnoreCase("metropolitana"))
                .thenReturn(Optional.of(metropolitana));
        when(tarifaRepository.buscarBase("metropolitana", "estandar"))
                .thenReturn(Optional.of(tarifa(metropolitana, null, estandar, 3500, 2)));

        CotizacionResponse respuesta = servicio.cotizar(new CotizacionRequest(
                "metropolitana", null, "estandar", new BigDecimal("10000")));

        assertEquals("metropolitana", respuesta.regionCodigo());
        assertEquals(new BigDecimal("10000.00"), respuesta.subtotal());
        assertEquals(new BigDecimal("3500.00"), respuesta.costoEnvio());
        assertEquals(new BigDecimal("13500.00"), respuesta.total());
        assertEquals("REGION", respuesta.origenTarifa());
        assertEquals(2, respuesta.diasHabiles());
        assertTrue(respuesta.requiereDireccion());
    }

    @Test
    void cotizarComunaConExcepcionUsaTarifaDeComuna() {
        MetodoDespacho estandar = metodo("estandar", "Envío estándar", true, null, 1);
        Region valparaiso = region("valparaiso", "Valparaíso", 6);
        Comuna isla = comuna("Isla de Pascua", "isla-de-pascua", valparaiso);
        when(metodoRepository.findByCodigoIgnoreCaseAndActivoTrue("estandar"))
                .thenReturn(Optional.of(estandar));
        when(regionRepository.findByCodigoIgnoreCase("valparaiso"))
                .thenReturn(Optional.of(valparaiso));
        when(comunaRepository.findByRegion_CodigoAndSlug("valparaiso", "isla-de-pascua"))
                .thenReturn(Optional.of(isla));
        when(tarifaRepository.buscarComuna("valparaiso", "isla-de-pascua", "estandar"))
                .thenReturn(Optional.of(tarifa(valparaiso, isla, estandar, 12000, 6)));

        CotizacionResponse respuesta = servicio.cotizar(new CotizacionRequest(
                "valparaiso", "Isla de Pascua", "estandar", new BigDecimal("5000")));

        assertEquals(new BigDecimal("12000.00"), respuesta.costoEnvio());
        assertEquals(new BigDecimal("17000.00"), respuesta.total());
        assertEquals("COMUNA", respuesta.origenTarifa());
        assertEquals("Isla de Pascua", respuesta.comuna());
    }

    @Test
    void cotizarComunaSinExcepcionUsaTarifaRegional() {
        MetodoDespacho estandar = metodo("estandar", "Envío estándar", true, null, 1);
        Region valparaiso = region("valparaiso", "Valparaíso", 6);
        Comuna vinia = comuna("Viña del Mar", "vina-del-mar", valparaiso);
        when(metodoRepository.findByCodigoIgnoreCaseAndActivoTrue("estandar"))
                .thenReturn(Optional.of(estandar));
        when(regionRepository.findByCodigoIgnoreCase("valparaiso"))
                .thenReturn(Optional.of(valparaiso));
        when(comunaRepository.findByRegion_CodigoAndSlug("valparaiso", "vina-del-mar"))
                .thenReturn(Optional.of(vinia));
        when(tarifaRepository.buscarComuna("valparaiso", "vina-del-mar", "estandar"))
                .thenReturn(Optional.empty());
        when(tarifaRepository.buscarBase("valparaiso", "estandar"))
                .thenReturn(Optional.of(tarifa(valparaiso, null, estandar, 4000, 2)));

        CotizacionResponse respuesta = servicio.cotizar(new CotizacionRequest(
                "valparaiso", "Viña del Mar", "estandar", BigDecimal.ZERO));

        assertEquals(new BigDecimal("4000.00"), respuesta.costoEnvio());
        assertEquals("REGION", respuesta.origenTarifa());
    }

    @Test
    void cotizarRetiroNoRequiereRegionYCuestaCero() {
        MetodoDespacho retiro = metodo("retiro", "Retiro presencial", false,
                new BigDecimal("0.00"), 3);
        when(metodoRepository.findByCodigoIgnoreCaseAndActivoTrue("retiro"))
                .thenReturn(Optional.of(retiro));

        CotizacionResponse respuesta = servicio.cotizar(new CotizacionRequest(
                null, null, "retiro", new BigDecimal("8990")));

        assertEquals(new BigDecimal("0.00"), respuesta.costoEnvio());
        assertEquals(new BigDecimal("8990.00"), respuesta.total());
        assertEquals("FIJO", respuesta.origenTarifa());
        assertNull(respuesta.regionCodigo());
        assertFalse(respuesta.requiereDireccion());
        verify(regionRepository, never()).findByCodigoIgnoreCase(anyString());
    }

    @Test
    void cotizarSoloConComunaResuelveSuRegion() {
        MetodoDespacho estandar = metodo("estandar", "Envío estándar", true, null, 1);
        Region metropolitana = region("metropolitana", "Región Metropolitana", 7);
        Comuna santiago = comuna("Santiago", "santiago", metropolitana);
        when(metodoRepository.findByCodigoIgnoreCaseAndActivoTrue("estandar"))
                .thenReturn(Optional.of(estandar));
        when(comunaRepository.findBySlug("santiago")).thenReturn(List.of(santiago));
        when(comunaRepository.findByRegion_CodigoAndSlug("metropolitana", "santiago"))
                .thenReturn(Optional.of(santiago));
        when(tarifaRepository.buscarComuna("metropolitana", "santiago", "estandar"))
                .thenReturn(Optional.empty());
        when(tarifaRepository.buscarBase("metropolitana", "estandar"))
                .thenReturn(Optional.of(tarifa(metropolitana, null, estandar, 3500, 2)));

        CotizacionResponse respuesta = servicio.cotizar(new CotizacionRequest(
                null, "Santiago", "estandar", new BigDecimal("10000")));

        assertEquals("metropolitana", respuesta.regionCodigo());
        assertEquals(new BigDecimal("13500.00"), respuesta.total());
        assertEquals("REGION", respuesta.origenTarifa());
    }

    @Test
    void cotizarEstandarSinRegionFalla() {
        MetodoDespacho estandar = metodo("estandar", "Envío estándar", true, null, 1);
        when(metodoRepository.findByCodigoIgnoreCaseAndActivoTrue("estandar"))
                .thenReturn(Optional.of(estandar));

        assertThrows(SolicitudInvalidaException.class, () ->
                servicio.cotizar(new CotizacionRequest(null, null, "estandar", BigDecimal.ZERO)));
    }

    @Test
    void cotizarMetodoInexistenteFalla() {
        when(metodoRepository.findByCodigoIgnoreCaseAndActivoTrue("no-existe"))
                .thenReturn(Optional.empty());

        assertThrows(SolicitudInvalidaException.class, () ->
                servicio.cotizar(new CotizacionRequest("metropolitana", null,
                        "no-existe", BigDecimal.ZERO)));
    }

    @Test
    void aceptaAliasDeRegionUsadoPorElFrontendActual() {
        MetodoDespacho estandar = metodo("estandar", "Envío estándar", true, null, 1);
        Region ohiggins = region("ohiggins", "O'Higgins", 8);
        when(metodoRepository.findByCodigoIgnoreCaseAndActivoTrue("estandar"))
                .thenReturn(Optional.of(estandar));
        when(regionRepository.findByCodigoIgnoreCase("ohiggins"))
                .thenReturn(Optional.of(ohiggins));
        when(tarifaRepository.buscarBase("ohiggins", "estandar"))
                .thenReturn(Optional.of(tarifa(ohiggins, null, estandar, 4000, 2)));

        CotizacionResponse respuesta = servicio.cotizar(new CotizacionRequest(
                "libgral", null, "estandar", BigDecimal.ZERO));

        assertEquals("ohiggins", respuesta.regionCodigo());
        assertEquals(new BigDecimal("4000.00"), respuesta.costoEnvio());
    }

    @Test
    void listarRegionesIncluyeComunas() {
        Region metropolitana = region("metropolitana", "Región Metropolitana", 7);
        when(regionRepository.findAllByOrderByOrdenAsc()).thenReturn(List.of(metropolitana));
        when(comunaRepository.findByRegion_CodigoOrderByNombreAsc("metropolitana"))
                .thenReturn(List.of(comuna("Santiago", "santiago", metropolitana)));

        List<RegionResponse> regiones = servicio.listarRegiones();

        assertEquals(1, regiones.size());
        assertEquals("metropolitana", regiones.getFirst().codigo());
        assertEquals("Santiago", regiones.getFirst().comunas().getFirst().nombre());
    }

    @Test
    void opcionesDevuelveLosTresMetodosConTotalActualizado() {
        Region metropolitana = region("metropolitana", "Región Metropolitana", 7);
        MetodoDespacho estandar = metodo("estandar", "Envío estándar", true, null, 1);
        MetodoDespacho express = metodo("express", "Envío express", true, null, 2);
        MetodoDespacho retiro = metodo("retiro", "Retiro presencial", false,
                new BigDecimal("0.00"), 3);
        when(regionRepository.findByCodigoIgnoreCase("metropolitana"))
                .thenReturn(Optional.of(metropolitana));
        when(metodoRepository.findAllByActivoTrueOrderByOrdenAsc())
                .thenReturn(List.of(estandar, express, retiro));
        when(tarifaRepository.buscarBase("metropolitana", "estandar"))
                .thenReturn(Optional.of(tarifa(metropolitana, null, estandar, 3500, 2)));
        when(tarifaRepository.buscarBase("metropolitana", "express"))
                .thenReturn(Optional.of(tarifa(metropolitana, null, express, 6500, 1)));

        OpcionesEnvioResponse respuesta = servicio.opciones(
                "metropolitana", null, new BigDecimal("10000"));

        assertEquals(3, respuesta.opciones().size());
        assertEquals(new BigDecimal("13500.00"), respuesta.opciones().get(0).total());
        assertEquals(new BigDecimal("16500.00"), respuesta.opciones().get(1).total());
        assertEquals(new BigDecimal("10000.00"), respuesta.opciones().get(2).total());
        assertEquals("retiro", respuesta.opciones().get(2).metodoCodigo());
    }

    private Region region(String codigo, String nombre, int orden) {
        Region region = new Region();
        region.setId((long) orden);
        region.setCodigo(codigo);
        region.setNombre(nombre);
        region.setOrden(orden);
        return region;
    }

    private Comuna comuna(String nombre, String slug, Region region) {
        Comuna comuna = new Comuna();
        comuna.setId(1L);
        comuna.setNombre(nombre);
        comuna.setSlug(slug);
        comuna.setRegion(region);
        return comuna;
    }

    private MetodoDespacho metodo(String codigo, String nombre, boolean requiereDireccion,
                                  BigDecimal costoFijo, int orden) {
        MetodoDespacho metodo = new MetodoDespacho();
        metodo.setId((long) orden);
        metodo.setCodigo(codigo);
        metodo.setNombre(nombre);
        metodo.setDescripcion("Descripción");
        metodo.setRequiereDireccion(requiereDireccion);
        metodo.setCostoFijo(costoFijo);
        metodo.setDiasHabiles(0);
        metodo.setActivo(true);
        metodo.setOrden(orden);
        return metodo;
    }

    private TarifaEnvio tarifa(Region region, Comuna comuna, MetodoDespacho metodo,
                               int costo, int dias) {
        TarifaEnvio tarifa = new TarifaEnvio();
        tarifa.setId(1L);
        tarifa.setCodigo("tarifa");
        tarifa.setRegion(region);
        tarifa.setComuna(comuna);
        tarifa.setMetodo(metodo);
        tarifa.setCosto(BigDecimal.valueOf(costo).setScale(2));
        tarifa.setDiasHabiles(dias);
        return tarifa;
    }
}
