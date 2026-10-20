package cl.bioforjarc.catalogo.service.impl;

import cl.bioforjarc.catalogo.dto.PaginaResponse;
import cl.bioforjarc.catalogo.dto.ProductoDetalleResponse;
import cl.bioforjarc.catalogo.dto.ProductoRequest;
import cl.bioforjarc.catalogo.dto.ProductoResumenResponse;
import cl.bioforjarc.catalogo.dto.ResumenInventarioResponse;
import cl.bioforjarc.catalogo.dto.ValidacionProductoResponse;
import cl.bioforjarc.catalogo.exception.RecursoNoEncontradoException;
import cl.bioforjarc.catalogo.exception.SolicitudInvalidaException;
import cl.bioforjarc.catalogo.model.Categoria;
import cl.bioforjarc.catalogo.model.Producto;
import cl.bioforjarc.catalogo.repository.CategoriaRepository;
import cl.bioforjarc.catalogo.repository.ProductoRepository;
import cl.bioforjarc.catalogo.repository.ProductoSpecifications;
import cl.bioforjarc.catalogo.service.ProductoService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class ProductoServiceImpl implements ProductoService {

    private static final int STOCK_BAJO = ProductoResumenResponse.UMBRAL_STOCK_BAJO;

    private final ProductoRepository productoRepository;
    private final CategoriaRepository categoriaRepository;

    public ProductoServiceImpl(ProductoRepository productoRepository,
                               CategoriaRepository categoriaRepository) {
        this.productoRepository = productoRepository;
        this.categoriaRepository = categoriaRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PaginaResponse<ProductoResumenResponse> listarCatalogo(String busqueda, List<String> categorias,
                                                                  String material, int pagina, int tamano) {
        Pageable pageable = PageRequest.of(pagina, tamano, Sort.by(Sort.Direction.ASC, "nombre"));
        Page<Producto> productos = productoRepository.findAll(
                ProductoSpecifications.filtros(busqueda, categorias, material, true), pageable);
        return PaginaResponse.desde(productos.map(ProductoResumenResponse::desde));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoDetalleResponse obtenerDetalle(Long id) {
        Producto producto = productoRepository.findDetallePorId(id)
                .filter(Producto::isActivo)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe un producto activo con id " + id));
        return ProductoDetalleResponse.desde(producto);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginaResponse<ProductoResumenResponse> listarInventario(String busqueda, List<String> categorias,
                                                                    Boolean activo, int pagina, int tamano) {
        Pageable pageable = PageRequest.of(pagina, tamano,
                Sort.by(Sort.Direction.DESC, "fechaRegistro"));
        Page<Producto> productos = productoRepository.findAll(
                ProductoSpecifications.filtros(busqueda, categorias, null, activo), pageable);
        return PaginaResponse.desde(productos.map(ProductoResumenResponse::desde));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoDetalleResponse obtenerInventario(Long id) {
        Producto producto = productoRepository.findDetallePorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe un producto con id " + id));
        return ProductoDetalleResponse.desde(producto);
    }

    @Override
    @Transactional(readOnly = true)
    public ResumenInventarioResponse resumenInventario() {
        return new ResumenInventarioResponse(
                productoRepository.count(),
                productoRepository.countByActivoTrue(),
                productoRepository.countByActivoFalse(),
                productoRepository.countByStockLessThan(STOCK_BAJO),
                productoRepository.sumarStockActivo());
    }

    @Override
    public ProductoDetalleResponse crear(ProductoRequest solicitud) {
        Categoria categoria = buscarCategoria(solicitud.categoriaSlug());

        Producto producto = new Producto();
        aplicarDatos(producto, solicitud, categoria);
        producto.setActivo(true);

        Producto guardado = productoRepository.save(producto);
        return ProductoDetalleResponse.desde(guardado);
    }

    @Override
    public ProductoDetalleResponse actualizar(Long id, ProductoRequest solicitud) {
        Producto producto = buscarProducto(id);
        Categoria categoria = buscarCategoria(solicitud.categoriaSlug());
        aplicarDatos(producto, solicitud, categoria);

        return ProductoDetalleResponse.desde(productoRepository.save(producto));
    }

    @Override
    public ProductoDetalleResponse cambiarEstado(Long id, boolean activo) {
        Producto producto = buscarProducto(id);
        producto.setActivo(activo);
        return ProductoDetalleResponse.desde(productoRepository.save(producto));
    }

    @Override
    @Transactional(readOnly = true)
    public ValidacionProductoResponse validar(Long id, int cantidad) {
        return productoRepository.findById(id)
                .map(producto -> ValidacionProductoResponse.desde(producto, cantidad))
                .orElseGet(() -> ValidacionProductoResponse.inexistente(id, cantidad));
    }

    private Producto buscarProducto(Long id) {
        return productoRepository.findDetallePorId(id)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe un producto con id " + id));
    }

    private Categoria buscarCategoria(String slug) {
        String buscado = slug == null ? "" : slug.trim();
        return categoriaRepository.findBySlugIgnoreCase(buscado)
                .orElseThrow(() -> new SolicitudInvalidaException(
                        "La categoría '" + buscado + "' no existe"));
    }

    private void aplicarDatos(Producto producto, ProductoRequest solicitud, Categoria categoria) {
        String imagen = solicitud.imagen().trim();

        producto.setNombre(solicitud.nombre().trim());
        producto.setDescripcion(solicitud.descripcion().trim());
        producto.setPrecio(solicitud.precio().setScale(2, RoundingMode.HALF_UP));
        producto.setStock(solicitud.stock());
        producto.setCategoria(categoria);
        producto.setMaterial(limpiarONulo(solicitud.material()));
        producto.setDimensiones(limpiarONulo(solicitud.dimensiones()));
        producto.setImagen(imagen);
        producto.setImagenes(normalizarGaleria(imagen, solicitud.imagenes()));
    }

    private List<String> normalizarGaleria(String imagenPrincipal, List<String> adicionales) {
        List<String> galeria = new ArrayList<>();
        galeria.add(imagenPrincipal);

        if (adicionales != null) {
            for (String imagen : adicionales) {
                if (imagen != null && !imagen.isBlank()) {
                    String limpia = imagen.trim();
                    if (!galeria.contains(limpia)) {
                        galeria.add(limpia);
                    }
                }
            }
        }
        return galeria;
    }

    private String limpiarONulo(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}
