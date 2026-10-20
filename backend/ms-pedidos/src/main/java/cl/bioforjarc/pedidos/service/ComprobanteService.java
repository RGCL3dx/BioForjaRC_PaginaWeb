package cl.bioforjarc.pedidos.service;

import cl.bioforjarc.pedidos.model.Pedido;

public interface ComprobanteService {

    byte[] generar(Pedido pedido);
}
