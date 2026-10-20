package cl.bioforjarc.pedidos.service;

import cl.bioforjarc.pedidos.dto.ReporteVentasResponse;
import cl.bioforjarc.pedidos.model.DetallePedido;
import cl.bioforjarc.pedidos.model.EstadoPago;
import cl.bioforjarc.pedidos.model.EstadoPedido;
import cl.bioforjarc.pedidos.model.MetodoPago;
import cl.bioforjarc.pedidos.model.Pedido;
import cl.bioforjarc.pedidos.model.TipoDocumento;
import cl.bioforjarc.pedidos.repository.PedidoRepository;
import cl.bioforjarc.pedidos.service.impl.ReporteServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReporteServiceImplTest {

    @Mock
    private PedidoRepository pedidoRepository;

    private ReporteServiceImpl servicio;

    @BeforeEach
    void preparar() {
        servicio = new ReporteServiceImpl(pedidoRepository);
    }

    @Test
    void calculaIndicadoresIngresosYTopProductos() {
        Pedido primero = pedido(LocalDateTime.of(2026, 10, 1, 10, 0),
                new BigDecimal("13500.00"));
        primero.agregarItem(item(10L, "Figura Ballena", 2,
                new BigDecimal("5000.00"), new BigDecimal("10000.00")));
        primero.agregarItem(item(11L, "Macetero", 1,
                new BigDecimal("3500.00"), new BigDecimal("3500.00")));

        Pedido segundo = pedido(LocalDateTime.of(2026, 10, 2, 15, 30),
                new BigDecimal("8000.00"));
        segundo.agregarItem(item(10L, "Figura Ballena", 1,
                new BigDecimal("8000.00"), new BigDecimal("8000.00")));

        when(pedidoRepository.buscarParaReporte(any(), any(), any(), any()))
                .thenReturn(List.of(primero, segundo));

        ReporteVentasResponse reporte = servicio.generar(
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31));

        assertEquals(new BigDecimal("21500.00"), reporte.totalVentas());
        assertEquals(new BigDecimal("10750.00"), reporte.ticketPromedio());
        assertEquals(2, reporte.cantidadPedidos());
        assertEquals(4, reporte.unidadesVendidas());
        assertEquals(2, reporte.ingresosPorDia().size());
        assertEquals(1, reporte.ingresosPorMes().size());
        assertEquals("2026-10", reporte.ingresosPorMes().getFirst().periodo());
        assertEquals(new BigDecimal("21500.00"), reporte.ingresosPorMes().getFirst().monto());
        assertEquals(2, reporte.topProductos().size());
        assertEquals(10L, reporte.topProductos().getFirst().productoId());
        assertEquals(3, reporte.topProductos().getFirst().unidades());
        assertEquals(new BigDecimal("18000.00"), reporte.topProductos().getFirst().ingresos());
    }

    @Test
    void reporteSinVentasDevuelveCeros() {
        when(pedidoRepository.buscarParaReporte(any(), any(), any(), any()))
                .thenReturn(List.of());

        ReporteVentasResponse reporte = servicio.generar(
                LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31));

        assertEquals(new BigDecimal("0.00"), reporte.totalVentas());
        assertEquals(new BigDecimal("0.00"), reporte.ticketPromedio());
        assertEquals(0, reporte.cantidadPedidos());
        assertEquals(0, reporte.unidadesVendidas());
    }

    private Pedido pedido(LocalDateTime fecha, BigDecimal total) {
        Pedido pedido = new Pedido();
        pedido.setNumeroOrden("BF-20261001-000001");
        pedido.setCorreo("cliente@bioforja.cl");
        pedido.setNombre("Ana");
        pedido.setApellido("Pérez");
        pedido.setDocumentoTipo(TipoDocumento.BOLETA);
        pedido.setMetodoDespacho("estandar");
        pedido.setSubtotal(total);
        pedido.setCostoEnvio(BigDecimal.ZERO);
        pedido.setTotal(total);
        pedido.setMetodoPago(MetodoPago.TARJETA);
        pedido.setEstadoPago(EstadoPago.PAGADO);
        pedido.setEstado(EstadoPedido.EN_PREPARACION);
        pedido.setFechaCreacion(fecha);
        return pedido;
    }

    private DetallePedido item(Long productoId, String nombre, int cantidad,
                               BigDecimal precio, BigDecimal subtotal) {
        DetallePedido item = new DetallePedido();
        item.setProductoId(productoId);
        item.setNombreProducto(nombre);
        item.setCantidad(cantidad);
        item.setPrecioUnitario(precio);
        item.setSubtotal(subtotal);
        return item;
    }
}
