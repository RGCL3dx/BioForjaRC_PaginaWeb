package cl.bioforjarc.envios.service;

import cl.bioforjarc.envios.dto.ComunaResponse;
import cl.bioforjarc.envios.dto.CotizacionRequest;
import cl.bioforjarc.envios.dto.CotizacionResponse;
import cl.bioforjarc.envios.dto.MetodoDespachoResponse;
import cl.bioforjarc.envios.dto.OpcionesEnvioResponse;
import cl.bioforjarc.envios.dto.RegionResponse;

import java.math.BigDecimal;
import java.util.List;

public interface EnvioService {

    List<RegionResponse> listarRegiones();

    RegionResponse obtenerRegion(String codigoRegion);

    List<ComunaResponse> listarComunas(String codigoRegion);

    List<MetodoDespachoResponse> listarMetodos();

    CotizacionResponse cotizar(CotizacionRequest solicitud);

    OpcionesEnvioResponse opciones(String regionCodigo, String comuna, BigDecimal subtotal);
}
