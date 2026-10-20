package cl.bioforjarc.pedidos.service.impl;

import cl.bioforjarc.pedidos.dto.IngresoPeriodoResponse;
import cl.bioforjarc.pedidos.dto.ProductoVendidoResponse;
import cl.bioforjarc.pedidos.dto.ReporteVentasResponse;
import cl.bioforjarc.pedidos.exception.SolicitudInvalidaException;
import cl.bioforjarc.pedidos.model.DetallePedido;
import cl.bioforjarc.pedidos.model.EstadoPago;
import cl.bioforjarc.pedidos.model.EstadoPedido;
import cl.bioforjarc.pedidos.model.Pedido;
import cl.bioforjarc.pedidos.repository.PedidoRepository;
import cl.bioforjarc.pedidos.service.ReporteService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
@Transactional(readOnly = true)
public class ReporteServiceImpl implements ReporteService {

    private static final int TOP_PRODUCTOS = 5;

    private final PedidoRepository pedidoRepository;

    public ReporteServiceImpl(PedidoRepository pedidoRepository) {
        this.pedidoRepository = pedidoRepository;
    }

    @Override
    public ReporteVentasResponse generar(LocalDate desde, LocalDate hasta) {
        LocalDate fin = hasta == null ? LocalDate.now() : hasta;
        LocalDate inicio = desde == null ? fin.withDayOfMonth(1) : desde;
        if (inicio.isAfter(fin)) {
            throw new SolicitudInvalidaException(
                    "La fecha desde no puede ser posterior a la fecha hasta");
        }

        List<Pedido> pedidos = pedidoRepository.buscarParaReporte(
                inicio.atStartOfDay(),
                fin.plusDays(1).atStartOfDay(),
                EstadoPedido.CANCELADO,
                EstadoPago.PAGADO);

        Map<String, Acumulado> porDia = new TreeMap<>();
        Map<String, Acumulado> porMes = new TreeMap<>();
        Map<Long, ProductoAcumulado> productos = new HashMap<>();
        BigDecimal totalVentas = BigDecimal.ZERO;
        long unidadesVendidas = 0;

        for (Pedido pedido : pedidos) {
            BigDecimal totalPedido = monto(pedido.getTotal());
            totalVentas = totalVentas.add(totalPedido);

            String dia = pedido.getFechaCreacion().toLocalDate().toString();
            String mes = YearMonth.from(pedido.getFechaCreacion()).toString();
            porDia.computeIfAbsent(dia, clave -> new Acumulado()).agregar(totalPedido);
            porMes.computeIfAbsent(mes, clave -> new Acumulado()).agregar(totalPedido);

            for (DetallePedido item : pedido.getItems()) {
                unidadesVendidas += item.getCantidad();
                ProductoAcumulado acumulado = productos.computeIfAbsent(
                        item.getProductoId(),
                        clave -> new ProductoAcumulado(item.getNombreProducto()));
                acumulado.unidades += item.getCantidad();
                acumulado.ingresos = acumulado.ingresos.add(monto(item.getSubtotal()));
            }
        }

        BigDecimal total = totalVentas.setScale(2, RoundingMode.HALF_UP);
        BigDecimal ticketPromedio = pedidos.isEmpty()
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : total.divide(BigDecimal.valueOf(pedidos.size()), 2, RoundingMode.HALF_UP);

        List<ProductoVendidoResponse> topProductos = productos.entrySet().stream()
                .map(entrada -> new ProductoVendidoResponse(
                        entrada.getKey(),
                        entrada.getValue().nombre,
                        entrada.getValue().unidades,
                        entrada.getValue().ingresos.setScale(2, RoundingMode.HALF_UP)))
                .sorted(Comparator
                        .comparingLong(ProductoVendidoResponse::unidades).reversed()
                        .thenComparing(ProductoVendidoResponse::ingresos, Comparator.reverseOrder()))
                .limit(TOP_PRODUCTOS)
                .toList();

        return new ReporteVentasResponse(
                inicio.toString(),
                fin.toString(),
                total,
                ticketPromedio,
                pedidos.size(),
                unidadesVendidas,
                porDia.entrySet().stream().map(entrada -> entrada.getValue().aRespuesta(entrada.getKey())).toList(),
                porMes.entrySet().stream().map(entrada -> entrada.getValue().aRespuesta(entrada.getKey())).toList(),
                topProductos);
    }

    private BigDecimal monto(BigDecimal valor) {
        return (valor == null ? BigDecimal.ZERO : valor).setScale(2, RoundingMode.HALF_UP);
    }

    private static final class Acumulado {
        private long pedidos;
        private BigDecimal monto = BigDecimal.ZERO;

        void agregar(BigDecimal valor) {
            pedidos++;
            monto = monto.add(valor);
        }

        IngresoPeriodoResponse aRespuesta(String periodo) {
            return new IngresoPeriodoResponse(
                    periodo, pedidos, monto.setScale(2, RoundingMode.HALF_UP));
        }
    }

    private static final class ProductoAcumulado {
        private final String nombre;
        private long unidades;
        private BigDecimal ingresos = BigDecimal.ZERO;

        private ProductoAcumulado(String nombre) {
            this.nombre = nombre;
        }
    }
}
