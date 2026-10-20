package cl.bioforjarc.catalogo.controller;

import cl.bioforjarc.catalogo.model.Producto;
import cl.bioforjarc.catalogo.repository.ProductoRepository;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class ProductoControllerIntegrationTest {

    private static final String SECRETO =
            "secreto-de-pruebas-ms-usuarios-bioforjarc-2026-no-usar-en-produccion";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ProductoRepository productoRepository;

    @Test
    void catalogoPublicoListaProductosActivosConBusquedaYFiltros() throws Exception {
        mockMvc.perform(get("/api/productos").param("tamano", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(18))
                .andExpect(jsonPath("$.contenido[0].activo").value(true));

        mockMvc.perform(get("/api/productos").param("q", "Ballena"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1))
                .andExpect(jsonPath("$.contenido[0].nombre").value("Ballena articulada"));

        mockMvc.perform(get("/api/productos")
                        .param("categorias", "maceteros")
                        .param("tamano", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(6))
                .andExpect(jsonPath("$.contenido[*].categoria.slug", everyItem(is("maceteros"))));

        mockMvc.perform(get("/api/productos")
                        .param("material", "reciclado")
                        .param("tamano", "50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(18));
    }

    @Test
    void detalleExponeFichaTecnicaGaleriaYStock() throws Exception {
        Producto producto = buscarPorNombre("Macetero clásico");

        mockMvc.perform(get("/api/productos/{id}", producto.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Macetero clásico"))
                .andExpect(jsonPath("$.stock").value(15))
                .andExpect(jsonPath("$.material").value("Plástico PET reciclado"))
                .andExpect(jsonPath("$.imagenes").isArray())
                .andExpect(jsonPath("$.imagenes[0]").value("../assets/imagenes/macetero-1.webp"))
                .andExpect(jsonPath("$.categoria.slug").value("maceteros"))
                .andExpect(jsonPath("$.activo").value(true));
    }

    @Test
    void crearProductoRequiereAdministradorYSePublicaDeInmediato() throws Exception {
        String cuerpo = cuerpoProducto("Producto nuevo", 4);

        mockMvc.perform(post("/api/productos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/productos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("CLIENTE"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isForbidden());

        MvcResult creado = mockMvc.perform(post("/api/productos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.activo").value(true))
                .andExpect(jsonPath("$.stockBajo").value(true))
                .andExpect(jsonPath("$.imagenes[0]").value("../assets/imagenes/prueba.webp"))
                .andReturn();

        long id = leerId(creado);
        mockMvc.perform(get("/api/productos/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nombre").value("Producto nuevo"));
    }

    @Test
    void editarProductoActualizaPrecioDescripcionStockYGaleria() throws Exception {
        long id = crearProducto("Producto editable", 8);

        String actualizado = """
                {
                  "nombre":"Producto editable",
                  "descripcion":"Descripción actualizada",
                  "precio":17500,
                  "stock":2,
                  "categoriaSlug":"articulados",
                  "material":"PET reciclado",
                  "dimensiones":"20 x 10 cm",
                  "imagen":"../assets/imagenes/actualizada.webp",
                  "imagenes":["../assets/imagenes/actualizada.webp","../assets/imagenes/actualizada-2.webp"]
                }
                """;

        mockMvc.perform(put("/api/productos/{id}", id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(actualizado))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.precio").value(17500.00))
                .andExpect(jsonPath("$.descripcion").value("Descripción actualizada"))
                .andExpect(jsonPath("$.stock").value(2))
                .andExpect(jsonPath("$.stockBajo").value(true))
                .andExpect(jsonPath("$.categoria.slug").value("articulados"))
                .andExpect(jsonPath("$.imagenes[1]").value("../assets/imagenes/actualizada-2.webp"));
    }

    @Test
    void bajaLogicaOcultaDelCatalogoPeroConservaInventario() throws Exception {
        long id = crearProducto("Producto desactivable", 10);

        mockMvc.perform(patch("/api/productos/{id}/estado", id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"activo\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(false));

        mockMvc.perform(get("/api/productos/{id}", id))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/productos")
                        .param("q", "Producto desactivable"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(0));

        mockMvc.perform(get("/api/productos/inventario/{id}", id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("ADMINISTRADOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activo").value(false));

        assertTrue(productoRepository.findById(id).orElseThrow().getFechaRegistro() != null);
    }

    @Test
    void inventarioIncluyeInactivosYResumenDeStockBajo() throws Exception {
        long id = crearProducto("Producto con stock bajo", 4);
        mockMvc.perform(patch("/api/productos/{id}/estado", id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"activo\":false}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/productos/inventario")
                        .param("q", "Producto con stock bajo")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("ADMINISTRADOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1))
                .andExpect(jsonPath("$.contenido[0].activo").value(false))
                .andExpect(jsonPath("$.contenido[0].stockBajo").value(true));

        mockMvc.perform(get("/api/productos/inventario/resumen")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("ADMINISTRADOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalProductos").value(19))
                .andExpect(jsonPath("$.inactivos").value(1))
                .andExpect(jsonPath("$.stockBajo").value(1));

        mockMvc.perform(get("/api/productos/inventario")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("CLIENTE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void validacionInternaInformaStockSuficiente() throws Exception {
        long id = crearProducto("Producto validable", 5);

        mockMvc.perform(get("/api/productos/{id}/validar", id).param("cantidad", "6"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.existe").value(true))
                .andExpect(jsonPath("$.stock").value(5))
                .andExpect(jsonPath("$.stockSuficiente").value(false));

        mockMvc.perform(get("/api/productos/{id}/validar", id).param("cantidad", "5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stockSuficiente").value(true));

        mockMvc.perform(get("/api/productos/{id}/validar", 999999L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.existe").value(false))
                .andExpect(jsonPath("$.stockSuficiente").value(false));
    }

    @Test
    void categoriasSonPublicasYEstanOrdenadas() throws Exception {
        mockMvc.perform(get("/api/categorias"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0].slug").value("maceteros"))
                .andExpect(jsonPath("$[1].slug").value("articulados"))
                .andExpect(jsonPath("$[3].slug").value("figuras"));
    }

    @Test
    void paginacionInvalidaDevuelve400() throws Exception {
        mockMvc.perform(get("/api/productos").param("pagina", "-1"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/productos").param("tamano", "100"))
                .andExpect(status().isBadRequest());
    }

    private long crearProducto(String nombre, int stock) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/productos")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token("ADMINISTRADOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoProducto(nombre, stock)))
                .andExpect(status().isCreated())
                .andReturn();
        return leerId(resultado);
    }

    private long leerId(MvcResult resultado) throws Exception {
        JsonNode nodo = objectMapper.readTree(resultado.getResponse().getContentAsString());
        assertNotNull(nodo.get("id"));
        return nodo.get("id").asLong();
    }

    private Producto buscarPorNombre(String nombre) {
        return productoRepository.findAll().stream()
                .filter(producto -> producto.getNombre().equals(nombre))
                .findFirst()
                .orElseThrow();
    }

    private String cuerpoProducto(String nombre, int stock) {
        return """
                {
                  "nombre":"%s",
                  "descripcion":"Descripción de prueba",
                  "precio":12990,
                  "stock":%d,
                  "categoriaSlug":"maceteros",
                  "material":"PET reciclado",
                  "dimensiones":"10 x 8 cm",
                  "imagen":"../assets/imagenes/prueba.webp",
                  "imagenes":["../assets/imagenes/prueba.webp","../assets/imagenes/prueba-2.webp"]
                }
                """.formatted(nombre, stock);
    }

    private String token(String rol) {
        SecretKey clave = Keys.hmacShaKeyFor(SECRETO.getBytes(StandardCharsets.UTF_8));
        Instant ahora = Instant.now();
        return Jwts.builder()
                .issuer("bioforjarc-ms-usuarios")
                .subject("prueba@bioforjarc.cl")
                .claim("rol", rol)
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plusSeconds(3600)))
                .signWith(clave)
                .compact();
    }
}
