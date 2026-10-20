package cl.bioforjarc.pedidos.service;

import cl.bioforjarc.pedidos.client.CatalogoClient;
import cl.bioforjarc.pedidos.client.CotizacionEnvio;
import cl.bioforjarc.pedidos.client.EnvioClient;
import cl.bioforjarc.pedidos.client.ProductoValidado;
import cl.bioforjarc.pedidos.client.UsuarioClient;
import cl.bioforjarc.pedidos.client.UsuarioValidado;
import cl.bioforjarc.pedidos.dto.CrearPedidoRequest;
import cl.bioforjarc.pedidos.dto.ItemPedidoRequest;
import cl.bioforjarc.pedidos.dto.PedidoDetalleResponse;
import cl.bioforjarc.pedidos.dto.PedidoResumenResponse;
import cl.bioforjarc.pedidos.exception.OperacionNoPermitidaException;
import cl.bioforjarc.pedidos.exception.SolicitudInvalidaException;
import cl.bioforjarc.pedidos.model.DetallePedido;
import cl.bioforjarc.pedidos.model.EstadoPago;
import cl.bioforjarc.pedidos.model.EstadoPedido;
import cl.bioforjarc.pedidos.model.MetodoPago;
import cl.bioforjarc.pedidos.model.Pedido;
import cl.bioforjarc.pedidos.model.TipoDocumento;
import cl.bioforjarc.pedidos.repository.PedidoRepository;
import cl.bioforjarc.pedidos.service.impl.PedidoServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PedidoServiceImplTest {

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private UsuarioClient usuarioClient;

    @Mock
    private CatalogoClient catalogoClient;

    @Mock
    private EnvioClient envioClient;

    private PedidoServiceImpl servicio;

    @BeforeEach
    void preparar() {
        servicio = new PedidoServiceImpl(pedidoRepository, usuarioClient, catalogoClient, envioClient);
    }

    @Test
    void crearPedidoCalculaTotalesConPrecioDelCatalogoYEnvio() {
        when(usuarioClient.validar("cliente@bioforja.cl"))
                .thenReturn(new UsuarioValidado(true, 7L, "cliente@bioforja.cl",
                        "Ana", "Pérez", true));
        when(catalogoClient.validar(10L, 2))
                .thenReturn(new ProductoValidado(true, 10L, "Figura Ballena",
                        new BigDecimal("5000.00"), 10, true, true, 2));
        when(envioClient.cotizar("metropolitana", "Santiago", "estandar",
                new BigDecimal("10000.00")))
                .thenReturn(new CotizacionEnvio("metropolitana", "Región Metropolitana",
                        "Santiago", "estandar", "Envío estándar",
                        new BigDecimal("10000.00"), new BigDecimal("3500.00"),
                        new BigDecimal("13500.00"), 2, true, "REGION"));
        when(pedidoRepository.existsByNumeroOrden(anyString())).thenReturn(false);
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocacion -> {
            Pedido pedido = invocacion.getArgument(0);
            pedido.setId(1L);
            return pedido;
        });

        PedidoDetalleResponse respuesta = servicio.crear(solicitudEstandar(), "cliente@bioforja.cl");

        assertEquals(1L, respuesta.id());
        assertNotNull(respuesta.numeroOrden());
        assertTrue(respuesta.numeroOrden().startsWith("BF-"));
        assertEquals(new BigDecimal("10000.00"), respuesta.subtotal());
        assertEquals(new BigDecimal("3500.00"), respuesta.costoEnvio());
        assertEquals(new BigDecimal("13500.00"), respuesta.total());
        assertEquals("Pagado", respuesta.estadoPago());
        assertTrue(respuesta.pagoSimulado());
        assertEquals(1, respuesta.items().size());
        assertEquals(2, respuesta.items().getFirst().cantidad());

        ArgumentCaptor<Pedido> captor = ArgumentCaptor.forClass(Pedido.class);
        verify(pedidoRepository).save(captor.capture());
        assertEquals("cliente@bioforja.cl", captor.getValue().getCorreo());
        assertEquals(7L, captor.getValue().getUsuarioId());
        assertEquals(EstadoPago.PAGADO, captor.getValue().getEstadoPago());
        assertEquals(EstadoPedido.EN_PREPARACION, captor.getValue().getEstado());
    }

    @Test
    void crearPedidoRetiroNoExigeDireccion() {
        when(usuarioClient.validar("cliente@bioforja.cl"))
                .thenReturn(new UsuarioValidado(true, 7L, "cliente@bioforja.cl",
                        "Ana", "Pérez", true));
        when(catalogoClient.validar(10L, 1))
                .thenReturn(new ProductoValidado(true, 10L, "Figura Ballena",
                        new BigDecimal("5000.00"), 10, true, true, 1));
        when(envioClient.cotizar(null, null, "retiro", new BigDecimal("5000.00")))
                .thenReturn(new CotizacionEnvio(null, null, null, "retiro", "Retiro presencial",
                        new BigDecimal("5000.00"), BigDecimal.ZERO,
                        new BigDecimal("5000.00"), 0, false, "FIJO"));
        when(pedidoRepository.existsByNumeroOrden(anyString())).thenReturn(false);
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocacion -> {
            Pedido pedido = invocacion.getArgument(0);
            pedido.setId(2L);
            return pedido;
        });

        CrearPedidoRequest solicitud = new CrearPedidoRequest(
                "Ana", "Pérez", "912345678", "12345678-5",
                TipoDocumento.BOLETA, null, null, null,
                null, null, null, "retiro", MetodoPago.TRANSFERENCIA,
                List.of(new ItemPedidoRequest(10L, 1)));

        PedidoDetalleResponse respuesta = servicio.crear(solicitud, "cliente@bioforja.cl");

        assertEquals(BigDecimal.ZERO.setScale(2), respuesta.costoEnvio());
        assertEquals(new BigDecimal("5000.00"), respuesta.total());
        assertFalse(respuesta.requiereDireccion());
    }

    @Test
    void facturaSinRutEsRechazadaAntesDeConsultarCatalogo() {
        when(usuarioClient.validar("cliente@bioforja.cl"))
                .thenReturn(new UsuarioValidado(true, 7L, "cliente@bioforja.cl",
                        "Ana", "Pérez", true));

        CrearPedidoRequest solicitud = new CrearPedidoRequest(
                "Ana", "Pérez", "912345678", "12345678-5",
                TipoDocumento.FACTURA, null, "BioForja SpA", "Comercio",
                "Av. Siempre Viva 123", "Santiago", "metropolitana", "estandar",
                MetodoPago.TARJETA, List.of(new ItemPedidoRequest(10L, 1)));

        assertThrows(SolicitudInvalidaException.class,
                () -> servicio.crear(solicitud, "cliente@bioforja.cl"));
        verify(catalogoClient, never()).validar(anyLong(), anyInt());
    }

    @Test
    void stockInsuficienteEsRechazado() {
        when(usuarioClient.validar("cliente@bioforja.cl"))
                .thenReturn(new UsuarioValidado(true, 7L, "cliente@bioforja.cl",
                        "Ana", "Pérez", true));
        when(catalogoClient.validar(10L, 2))
                .thenReturn(new ProductoValidado(true, 10L, "Figura Ballena",
                        new BigDecimal("5000.00"), 1, true, false, 2));

        assertThrows(SolicitudInvalidaException.class,
                () -> servicio.crear(solicitudEstandar(), "cliente@bioforja.cl"));
        verify(pedidoRepository, never()).save(any(Pedido.class));
    }

    @Test
    void unClienteNoPuedeVerPedidoDeOtro() {
        Pedido pedido = pedido(1L, "otro@bioforja.cl");
        when(pedidoRepository.buscarDetalle(1L)).thenReturn(Optional.of(pedido));

        assertThrows(OperacionNoPermitidaException.class,
                () -> servicio.obtener(1L, "cliente@bioforja.cl", false));
        assertNotNull(servicio.obtener(1L, "cliente@bioforja.cl", true));
    }

    @Test
    void listarMiosDevuelveResumenes() {
        Pedido pedido = pedido(4L, "cliente@bioforja.cl");
        when(pedidoRepository.buscarHistorial("cliente@bioforja.cl"))
                .thenReturn(List.of(pedido));

        List<PedidoResumenResponse> historial = servicio.listarMios("cliente@bioforja.cl");

        assertEquals(1, historial.size());
        assertEquals("BF-20261019-000004", historial.getFirst().numeroOrden());
        assertEquals("En preparación", historial.getFirst().estado());
    }

    @Test
    void administradorPuedeCambiarEstado() {
        Pedido pedido = pedido(1L, "cliente@bioforja.cl");
        when(pedidoRepository.buscarDetalle(1L)).thenReturn(Optional.of(pedido));
        when(pedidoRepository.save(any(Pedido.class))).thenAnswer(invocacion -> invocacion.getArgument(0));

        PedidoDetalleResponse respuesta = servicio.cambiarEstado(1L, EstadoPedido.DESPACHADO);

        assertEquals("Despachado", respuesta.estado());
    }

    private CrearPedidoRequest solicitudEstandar() {
        return new CrearPedidoRequest(
                "Ana", "Pérez", "912345678", "12345678-5",
                TipoDocumento.BOLETA, null, null, null,
                "Av. Siempre Viva 123", "Santiago", "metropolitana", "estandar",
                MetodoPago.TARJETA, List.of(new ItemPedidoRequest(10L, 2)));
    }

    private Pedido pedido(Long id, String correo) {
        Pedido pedido = new Pedido();
        pedido.setId(id);
        pedido.setNumeroOrden("BF-20261019-000004");
        pedido.setCorreo(correo);
        pedido.setNombre("Ana");
        pedido.setApellido("Pérez");
        pedido.setDocumentoTipo(TipoDocumento.BOLETA);
        pedido.setMetodoDespacho("estandar");
        pedido.setMetodoDespachoNombre("Envío estándar");
        pedido.setSubtotal(new BigDecimal("10000.00"));
        pedido.setCostoEnvio(new BigDecimal("3500.00"));
        pedido.setTotal(new BigDecimal("13500.00"));
        pedido.setMetodoPago(MetodoPago.TARJETA);
        pedido.setEstadoPago(EstadoPago.PAGADO);
        pedido.setEstado(EstadoPedido.EN_PREPARACION);
        pedido.setFechaCreacion(LocalDateTime.now());

        DetallePedido item = new DetallePedido();
        item.setProductoId(10L);
        item.setNombreProducto("Figura Ballena");
        item.setCantidad(2);
        item.setPrecioUnitario(new BigDecimal("5000.00"));
        item.setSubtotal(new BigDecimal("10000.00"));
        pedido.agregarItem(item);
        return pedido;
    }
}
