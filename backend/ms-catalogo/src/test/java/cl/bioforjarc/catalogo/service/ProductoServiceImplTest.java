package cl.bioforjarc.catalogo.service;

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
import cl.bioforjarc.catalogo.service.impl.ProductoServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductoServiceImplTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private CategoriaRepository categoriaRepository;

    private ProductoServiceImpl servicio;

    @BeforeEach
    void preparar() {
        servicio = new ProductoServiceImpl(productoRepository, categoriaRepository);
    }

    @Test
    void crearPublicaProductoActivoConGaleriaYPrecisionDePrecio() {
        when(categoriaRepository.findBySlugIgnoreCase("maceteros"))
                .thenReturn(Optional.of(categoria("Maceteros", "maceteros")));
        when(productoRepository.save(any(Producto.class))).thenAnswer(invocacion -> {
            Producto guardado = invocacion.getArgument(0);
            guardado.setId(99L);
            guardado.setFechaRegistro(LocalDateTime.now());
            guardado.setFechaActualizacion(LocalDateTime.now());
            return guardado;
        });

        ProductoRequest solicitud = new ProductoRequest(
                "  Macetero de prueba ", "Descripción de prueba", new BigDecimal("12345.678"),
                7, "maceteros", "PLA reciclado", "10 x 8 cm",
                "../assets/imagenes/macetero-1.webp",
                List.of("../assets/imagenes/macetero-2.webp", "../assets/imagenes/macetero-1.webp"));

        ProductoDetalleResponse respuesta = servicio.crear(solicitud);

        ArgumentCaptor<Producto> captor = ArgumentCaptor.forClass(Producto.class);
        verify(productoRepository).save(captor.capture());
        Producto guardado = captor.getValue();

        assertEquals(99L, respuesta.id());
        assertEquals("Macetero de prueba", guardado.getNombre());
        assertEquals(new BigDecimal("12345.68"), guardado.getPrecio());
        assertEquals(7, guardado.getStock());
        assertTrue(guardado.isActivo());
        assertFalse(respuesta.stockBajo());
        assertEquals(List.of(
                "../assets/imagenes/macetero-1.webp",
                "../assets/imagenes/macetero-2.webp"), guardado.getImagenes());
        assertEquals("maceteros", respuesta.categoria().slug());
    }

    @Test
    void crearRechazaCategoriaInexistente() {
        when(categoriaRepository.findBySlugIgnoreCase("no-existe")).thenReturn(Optional.empty());

        ProductoRequest solicitud = new ProductoRequest(
                "Producto", "Descripción", new BigDecimal("1000"), 1,
                "no-existe", null, null, "../assets/imagenes/SINIMAGEN.png", null);

        assertThrows(SolicitudInvalidaException.class, () -> servicio.crear(solicitud));
        verify(productoRepository, never()).save(any(Producto.class));
    }

    @Test
    void actualizarCambiaPrecioStockDescripcionEImagenes() {
        Producto existente = producto(5L, "Antiguo", 10, true);
        when(productoRepository.findDetallePorId(5L)).thenReturn(Optional.of(existente));
        when(categoriaRepository.findBySlugIgnoreCase("articulados"))
                .thenReturn(Optional.of(categoria("Animales articulados", "articulados")));
        when(productoRepository.save(existente)).thenReturn(existente);

        ProductoRequest solicitud = new ProductoRequest(
                "Nuevo nombre", "Nueva descripción", new BigDecimal("15990"), 3,
                "articulados", "PET reciclado", "15 cm",
                "../assets/imagenes/nueva.webp", List.of("../assets/imagenes/nueva-2.webp"));

        ProductoDetalleResponse respuesta = servicio.actualizar(5L, solicitud);

        assertEquals("Nuevo nombre", respuesta.nombre());
        assertEquals(new BigDecimal("15990.00"), respuesta.precio());
        assertEquals(3, respuesta.stock());
        assertTrue(respuesta.stockBajo());
        assertEquals(List.of("../assets/imagenes/nueva.webp",
                "../assets/imagenes/nueva-2.webp"), respuesta.imagenes());
    }

    @Test
    void cambiarEstadoAplicaBajaLogicaSinEliminar() {
        Producto existente = producto(8L, "Producto", 10, true);
        when(productoRepository.findDetallePorId(8L)).thenReturn(Optional.of(existente));
        when(productoRepository.save(existente)).thenReturn(existente);

        ProductoDetalleResponse respuesta = servicio.cambiarEstado(8L, false);

        assertFalse(respuesta.activo());
        assertFalse(existente.isActivo());
        verify(productoRepository, never()).delete(any(Producto.class));
    }

    @Test
    void validarIndicaStockSuficienteOSobreventa() {
        Producto existente = producto(2L, "Producto", 5, true);
        when(productoRepository.findById(2L)).thenReturn(Optional.of(existente));

        ValidacionProductoResponse suficiente = servicio.validar(2L, 5);
        ValidacionProductoResponse insuficiente = servicio.validar(2L, 6);

        assertTrue(suficiente.existe());
        assertTrue(suficiente.stockSuficiente());
        assertFalse(insuficiente.stockSuficiente());
        assertEquals(6, insuficiente.cantidadSolicitada());
    }

    @Test
    void validarProductoInexistenteNoLanzaError() {
        when(productoRepository.findById(404L)).thenReturn(Optional.empty());

        ValidacionProductoResponse respuesta = servicio.validar(404L, 1);

        assertFalse(respuesta.existe());
        assertFalse(respuesta.stockSuficiente());
    }

    @Test
    void resumenInventarioAgrupaTotalesYAlertas() {
        when(productoRepository.count()).thenReturn(18L);
        when(productoRepository.countByActivoTrue()).thenReturn(16L);
        when(productoRepository.countByActivoFalse()).thenReturn(2L);
        when(productoRepository.countByStockLessThan(5)).thenReturn(3L);
        when(productoRepository.sumarStockActivo()).thenReturn(240L);

        ResumenInventarioResponse resumen = servicio.resumenInventario();

        assertEquals(18L, resumen.totalProductos());
        assertEquals(16L, resumen.activos());
        assertEquals(2L, resumen.inactivos());
        assertEquals(3L, resumen.stockBajo());
        assertEquals(240L, resumen.unidadesDisponibles());
    }

    @Test
    void listarCatalogoDevuelveSoloContenidoMapeado() {
        Producto existente = producto(1L, "Macetero clásico", 15, true);
        when(productoRepository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(existente)));

        PaginaResponse<ProductoResumenResponse> pagina =
                servicio.listarCatalogo("macetero", List.of("maceteros"), null, 0, 12);

        assertEquals(1, pagina.contenido().size());
        assertEquals("Macetero clásico", pagina.contenido().getFirst().nombre());
        assertFalse(pagina.contenido().getFirst().stockBajo());
        assertEquals("maceteros", pagina.contenido().getFirst().categoria().slug());
        assertNotNull(pagina.contenido().getFirst().imagen());
    }

    @Test
    void obtenerDetalleInactivoLanzaNoEncontradoParaPublico() {
        Producto inactivo = producto(9L, "Oculto", 10, false);
        when(productoRepository.findDetallePorId(9L)).thenReturn(Optional.of(inactivo));

        assertThrows(RecursoNoEncontradoException.class, () -> servicio.obtenerDetalle(9L));
    }

    private Categoria categoria(String nombre, String slug) {
        Categoria categoria = new Categoria();
        categoria.setId(1L);
        categoria.setNombre(nombre);
        categoria.setSlug(slug);
        categoria.setOrden(1);
        return categoria;
    }

    private Producto producto(Long id, String nombre, int stock, boolean activo) {
        Producto producto = new Producto();
        producto.setId(id);
        producto.setNombre(nombre);
        producto.setDescripcion("Descripción");
        producto.setPrecio(new BigDecimal("9990.00"));
        producto.setStock(stock);
        producto.setCategoria(categoria("Maceteros", "maceteros"));
        producto.setMaterial("PET reciclado");
        producto.setImagen("../assets/imagenes/producto.webp");
        producto.setImagenes(List.of("../assets/imagenes/producto.webp"));
        producto.setActivo(activo);
        producto.setFechaRegistro(LocalDateTime.now());
        producto.setFechaActualizacion(LocalDateTime.now());
        return producto;
    }
}
