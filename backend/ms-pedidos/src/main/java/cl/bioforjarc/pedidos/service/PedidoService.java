package cl.bioforjarc.pedidos.service;

import cl.bioforjarc.pedidos.dto.CrearPedidoRequest;
import cl.bioforjarc.pedidos.dto.PaginaResponse;
import cl.bioforjarc.pedidos.dto.PedidoDetalleResponse;
import cl.bioforjarc.pedidos.dto.PedidoResumenResponse;
import cl.bioforjarc.pedidos.model.EstadoPedido;
import cl.bioforjarc.pedidos.model.Pedido;

import java.time.LocalDate;
import java.util.List;

public interface PedidoService {

    PedidoDetalleResponse crear(CrearPedidoRequest solicitud, String correo);

    List<PedidoResumenResponse> listarMios(String correo);

    PaginaResponse<PedidoResumenResponse> listarAdmin(String q, String estado,
                                                      LocalDate desde, LocalDate hasta,
                                                      int pagina, int tamano);

    PedidoDetalleResponse obtener(Long id, String correo, boolean administrador);

    PedidoDetalleResponse cambiarEstado(Long id, EstadoPedido estado);

    Pedido obtenerEntidadAutorizada(Long id, String correo, boolean administrador);
}
