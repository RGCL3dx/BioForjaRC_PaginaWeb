package cl.bioforjarc.catalogo.service;

import cl.bioforjarc.catalogo.dto.PaginaResponse;
import cl.bioforjarc.catalogo.dto.ProductoDetalleResponse;
import cl.bioforjarc.catalogo.dto.ProductoRequest;
import cl.bioforjarc.catalogo.dto.ProductoResumenResponse;
import cl.bioforjarc.catalogo.dto.ResumenInventarioResponse;
import cl.bioforjarc.catalogo.dto.ValidacionProductoResponse;

import java.util.List;

public interface ProductoService {

    PaginaResponse<ProductoResumenResponse> listarCatalogo(String busqueda, List<String> categorias,
                                                           String material, int pagina, int tamano);

    ProductoDetalleResponse obtenerDetalle(Long id);

    PaginaResponse<ProductoResumenResponse> listarInventario(String busqueda, List<String> categorias,
                                                             Boolean activo, int pagina, int tamano);

    ProductoDetalleResponse obtenerInventario(Long id);

    ResumenInventarioResponse resumenInventario();

    ProductoDetalleResponse crear(ProductoRequest solicitud);

    ProductoDetalleResponse actualizar(Long id, ProductoRequest solicitud);

    ProductoDetalleResponse cambiarEstado(Long id, boolean activo);

    ValidacionProductoResponse validar(Long id, int cantidad);
}
