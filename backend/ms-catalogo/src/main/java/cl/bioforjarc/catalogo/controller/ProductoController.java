package cl.bioforjarc.catalogo.controller;

import cl.bioforjarc.catalogo.dto.EstadoProductoRequest;
import cl.bioforjarc.catalogo.dto.PaginaResponse;
import cl.bioforjarc.catalogo.dto.ProductoDetalleResponse;
import cl.bioforjarc.catalogo.dto.ProductoRequest;
import cl.bioforjarc.catalogo.dto.ProductoResumenResponse;
import cl.bioforjarc.catalogo.dto.ResumenInventarioResponse;
import cl.bioforjarc.catalogo.dto.ValidacionProductoResponse;
import cl.bioforjarc.catalogo.service.ProductoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@Validated
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    /** HU-01.1, HU-01.2 y HU-01.3: catálogo público paginado y filtrable. */
    @GetMapping
    public PaginaResponse<ProductoResumenResponse> listar(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<String> categorias,
            @RequestParam(required = false) String material,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "La página no puede ser negativa") int pagina,
            @RequestParam(defaultValue = "12") @Min(value = 1, message = "El tamaño mínimo es 1")
            @Max(value = 50, message = "El tamaño máximo es 50") int tamano) {
        return productoService.listarCatalogo(q, categorias, material, pagina, tamano);
    }

    /** HU-01.4: ficha completa de un producto activo. */
    @GetMapping("/{id}")
    public ProductoDetalleResponse detalle(@PathVariable Long id) {
        return productoService.obtenerDetalle(id);
    }

    /** Validación interna para ms-pedidos: existencia, estado y stock suficiente. */
    @GetMapping("/{id}/validar")
    public ValidacionProductoResponse validar(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") @Min(value = 1, message = "La cantidad mínima es 1")
            @Max(value = 999, message = "La cantidad máxima es 999") int cantidad) {
        return productoService.validar(id, cantidad);
    }

    /** HU-08.1: inventario completo, incluidos productos desactivados. */
    @GetMapping("/inventario")
    public PaginaResponse<ProductoResumenResponse> inventario(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<String> categorias,
            @RequestParam(required = false) Boolean activo,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "La página no puede ser negativa") int pagina,
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "El tamaño mínimo es 1")
            @Max(value = 50, message = "El tamaño máximo es 50") int tamano) {
        return productoService.listarInventario(q, categorias, activo, pagina, tamano);
    }

    @GetMapping("/inventario/resumen")
    public ResumenInventarioResponse resumenInventario() {
        return productoService.resumenInventario();
    }

    @GetMapping("/inventario/{id}")
    public ProductoDetalleResponse detalleInventario(@PathVariable Long id) {
        return productoService.obtenerInventario(id);
    }

    /** HU-08.2: alta de producto, publicada inmediatamente. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductoDetalleResponse crear(@Valid @RequestBody ProductoRequest solicitud) {
        return productoService.crear(solicitud);
    }

    /** HU-08.3: edición de precio, descripción, imágenes y stock. */
    @PutMapping("/{id}")
    public ProductoDetalleResponse actualizar(@PathVariable Long id,
                                              @Valid @RequestBody ProductoRequest solicitud) {
        return productoService.actualizar(id, solicitud);
    }

    /** HU-08.3: baja lógica sin eliminar el producto. */
    @PatchMapping("/{id}/estado")
    public ProductoDetalleResponse cambiarEstado(@PathVariable Long id,
                                                 @Valid @RequestBody EstadoProductoRequest solicitud) {
        return productoService.cambiarEstado(id, solicitud.activo());
    }
}
