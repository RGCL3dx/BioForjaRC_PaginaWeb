package cl.bioforjarc.catalogo.config;

import cl.bioforjarc.catalogo.model.Categoria;
import cl.bioforjarc.catalogo.model.Producto;
import cl.bioforjarc.catalogo.repository.CategoriaRepository;
import cl.bioforjarc.catalogo.repository.ProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Catálogo inicial tomado de los datos que ya muestra el sitio actual.
 * Solo crea registros faltantes; no sobrescribe cambios hechos por el
 * administrador.
 */
@Component
@ConditionalOnProperty(prefix = "bioforja.semilla", name = "habilitada",
        havingValue = "true", matchIfMissing = true)
public class DatosSemillaCatalogo implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatosSemillaCatalogo.class);
    private static final String MATERIAL = "Plástico PET reciclado";

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    public DatosSemillaCatalogo(CategoriaRepository categoriaRepository,
                                ProductoRepository productoRepository) {
        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        crearCategoria("Maceteros", "maceteros",
                "Maceteros decorativos impresos con plástico reciclado.", 1);
        crearCategoria("Animales articulados", "articulados",
                "Figuras articuladas para coleccionar y regalar.", 2);
        crearCategoria("Sensoriales", "sensorial",
                "Juguetes y piezas para estimulación y motricidad fina.", 3);
        crearCategoria("Figuras ecológicas", "figuras",
                "Figuras decorativas elaboradas con plástico reciclado.", 4);

        crearProducto("Macetero clásico",
                "Diseño atemporal para tus plantas de interior y exterior.",
                8990, "macetero-1.webp", "maceteros");
        crearProducto("Macetero moderno",
                "Líneas actuales que combinan con cualquier decoración.",
                8990, "macetero-2.webp", "maceteros");
        crearProducto("Macetero orgánico",
                "Acabado natural inspirado en formas del entorno.",
                9990, "macetero-3.jpeg", "maceteros");
        crearProducto("Macetero minimalista",
                "Colores neutros y silueta limpia para espacios simples.",
                7990, "macetero-4.webp", "maceteros");
        crearProducto("Macetero cónico",
                "Forma cónica estable y de gran resistencia.",
                8990, "macetero-5.jpg", "maceteros");
        crearProducto("Macetero ecléctico",
                "Pieza única con personalidad y diseño propio.",
                10990, "macetero-6.webp", "maceteros");

        crearProducto("Ballena articulada",
                "Pieza móvil con aletas flexibles para coleccionar.",
                12990, "articulado-ballena.jpg", "articulados");
        crearProducto("Cocodrilo articulado",
                "Figura articulada de gran detalle y tamaño.",
                12990, "articulado-cocodrilo.jpg", "articulados");
        crearProducto("Conejo articulado",
                "Mascota móvil perfecta para regalos infantiles.",
                9990, "articulado-conejo.webp", "articulados");
        crearProducto("Lobo articulado",
                "Pieza imponente con movimiento en cuerpo y cola.",
                13990, "articulado-lobo.jpg", "articulados");
        crearProducto("Perro articulado",
                "Compañero movible, ideal para mesas y repisas.",
                9990, "articulado-perro.jpg", "articulados");
        crearProducto("Pulpo articulado",
                "Figura de tentáculos flexibles y decoración vibrante.",
                11990, "articulado-pulpo.webp", "articulados");

        crearProducto("Tablero de botones",
                "Estimula la motricidad fina con texturas variadas.",
                7990, "sensorial-botones.jpg", "sensorial");
        crearProducto("Cono sensorial",
                "Forma ergonómica ideal para el agarre infantil.",
                6990, "sensorial-cono.jpg", "sensorial");
        crearProducto("Cubo sensorial",
                "Cubo de caras texturizadas que enfoca la atención.",
                7990, "sensorial-cubo.jpg", "sensorial");
        crearProducto("Estrella sensorial",
                "Pieza ligera y colorida para juego y terapia.",
                6990, "sensorial-star.webp", "sensorial");

        crearProducto("Set de figuras ecológicas",
                "Colección decorativa hecha 100% con plástico reciclado.",
                14990, "figuras-ecologicas.jpg", "figuras");
        crearProducto("Figuras ecológicas surtidas",
                "Piezas variadas con acabados únicos para regalar.",
                12990, "figuras-ecologicas2.jpg", "figuras");

        log.info("Catálogo semilla disponible: {} productos, {} categorías",
                productoRepository.count(), categoriaRepository.count());
    }

    private void crearCategoria(String nombre, String slug, String descripcion, int orden) {
        if (categoriaRepository.existsBySlugIgnoreCase(slug)) {
            return;
        }
        Categoria categoria = new Categoria();
        categoria.setNombre(nombre);
        categoria.setSlug(slug);
        categoria.setDescripcion(descripcion);
        categoria.setOrden(orden);
        categoriaRepository.save(categoria);
    }

    private void crearProducto(String nombre, String descripcion, int precio,
                               String archivoImagen, String slugCategoria) {
        if (productoRepository.existsByNombreIgnoreCase(nombre)) {
            return;
        }
        Categoria categoria = categoriaRepository.findBySlugIgnoreCase(slugCategoria).orElseThrow();
        String imagen = "../assets/imagenes/" + archivoImagen;

        Producto producto = new Producto();
        producto.setNombre(nombre);
        producto.setDescripcion(descripcion);
        producto.setPrecio(BigDecimal.valueOf(precio).setScale(2));
        producto.setStock(15);
        producto.setCategoria(categoria);
        producto.setMaterial(MATERIAL);
        producto.setImagen(imagen);
        producto.setImagenes(List.of(imagen));
        producto.setActivo(true);
        productoRepository.save(producto);
    }
}
