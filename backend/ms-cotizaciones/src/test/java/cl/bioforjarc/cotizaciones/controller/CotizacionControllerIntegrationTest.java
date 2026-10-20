package cl.bioforjarc.cotizaciones.controller;

import cl.bioforjarc.cotizaciones.model.Cotizacion;
import cl.bioforjarc.cotizaciones.repository.CotizacionRepository;
import cl.bioforjarc.cotizaciones.security.JwtTestUtils;
import cl.bioforjarc.cotizaciones.service.CorreoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Comparator;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.matchesPattern;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CotizacionControllerIntegrationTest {

    private static final String ADMIN = "Bearer " + JwtTestUtils.tokenAdmin();
    private static final String CLIENTE = "Bearer " + JwtTestUtils.tokenCliente();

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private CotizacionRepository cotizacionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CorreoService correoService;

    @Value("${bioforja.archivos.directorio}")
    private String directorioArchivos;

    @BeforeEach
    void preparar() {
        cotizacionRepository.deleteAll();
        limpiarDirectorio();
    }

    @Test
    void creaCotizacionPublicaConArchivos3D() throws Exception {
        MockMultipartFile stl = new MockMultipartFile("archivos", "ballena.stl",
                "model/stl", "solid ballena".getBytes(StandardCharsets.UTF_8));
        MockMultipartFile obj = new MockMultipartFile("archivos", "soporte.obj",
                "model/obj", "v 0 0 0".getBytes(StandardCharsets.UTF_8));

        MvcResult resultado = mockMvc.perform(peticionCreacion().file(stl).file(obj))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("Pendiente"))
                .andExpect(jsonPath("$.numeroTicket", matchesPattern("COT-\\d{8}-\\d{6}")))
                .andExpect(jsonPath("$.correo").value("ana.perez@correo.cl"))
                .andExpect(jsonPath("$.archivos.length()").value(2))
                .andExpect(jsonPath("$.archivos[0].nombreOriginal").value("ballena.stl"))
                .andExpect(jsonPath("$.archivos[0].extension").value("stl"))
                .andExpect(jsonPath("$.archivos[0].tamanoLegible").isNotEmpty())
                .andExpect(jsonPath("$.archivos[0].descargaUrl",
                        startsWith("/api/cotizaciones/archivos/")))
                .andReturn();

        JsonNode json = leerJson(resultado);
        assertEquals("Ana", json.get("nombre").asText());
        assertEquals(2, contarArchivosEnDisco());
    }

    @Test
    void aceptaCotizacionSinArchivosAdjuntos() throws Exception {
        mockMvc.perform(peticionCreacion())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.estado").value("Pendiente"))
                .andExpect(jsonPath("$.archivos.length()").value(0));
    }

    @Test
    void rechazaArchivoConExtensionNoPermitida() throws Exception {
        MockMultipartFile archivo = new MockMultipartFile("archivos", "plano.txt",
                "text/plain", "hola".getBytes(StandardCharsets.UTF_8));

        mockMvc.perform(peticionCreacion().file(archivo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje", containsString("STL")))
                .andExpect(jsonPath("$.mensaje", containsString("OBJ")));
    }

    @Test
    void rechazaDatosDeFormularioInvalidos() throws Exception {
        mockMvc.perform(multipart("/api/cotizaciones")
                        .param("nombre", "")
                        .param("apellido", "Perez")
                        .param("correo", "no-es-correo")
                        .param("categoria", "figuras")
                        .param("descripcion", "corta"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detalles.nombre").exists())
                .andExpect(jsonPath("$.detalles.correo").exists())
                .andExpect(jsonPath("$.detalles.descripcion").exists());
    }

    @Test
    void listadoExigeAdministrador() throws Exception {
        mockMvc.perform(get("/api/cotizaciones"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/cotizaciones").header(HttpHeaders.AUTHORIZATION, CLIENTE))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/cotizaciones").header(HttpHeaders.AUTHORIZATION, ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(0));
    }

    @Test
    void listaFiltraPorEstadoTextoPaginaYFecha() throws Exception {
        JsonNode primera = leerJson(crearCotizacion());
        crearCotizacion();

        mockMvc.perform(get("/api/cotizaciones").header(HttpHeaders.AUTHORIZATION, ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(2));

        mockMvc.perform(get("/api/cotizaciones")
                        .header(HttpHeaders.AUTHORIZATION, ADMIN)
                        .param("estado", "Pendiente"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(2));

        mockMvc.perform(get("/api/cotizaciones")
                        .header(HttpHeaders.AUTHORIZATION, ADMIN)
                        .param("q", primera.get("numeroTicket").asText()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1))
                .andExpect(jsonPath("$.contenido[0].numeroTicket",
                        matchesPattern("COT-\\d{8}-\\d{6}")));

        mockMvc.perform(get("/api/cotizaciones")
                        .header(HttpHeaders.AUTHORIZATION, ADMIN)
                        .param("tamano", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenido.length()").value(1))
                .andExpect(jsonPath("$.totalPaginas").value(2))
                .andExpect(jsonPath("$.primera").value(true))
                .andExpect(jsonPath("$.ultima").value(false));

        mockMvc.perform(get("/api/cotizaciones")
                        .header(HttpHeaders.AUTHORIZATION, ADMIN)
                        .param("desde", LocalDate.now().toString())
                        .param("hasta", LocalDate.now().toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(2));

        mockMvc.perform(get("/api/cotizaciones")
                        .header(HttpHeaders.AUTHORIZATION, ADMIN)
                        .param("estado", "NoExiste"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void muestraDetalleYDescargaArchivoSoloParaAdministrador() throws Exception {
        MockMultipartFile stl = new MockMultipartFile("archivos", "ballena.stl",
                "model/stl", "solid ballena".getBytes(StandardCharsets.UTF_8));
        JsonNode creada = leerJson(mockMvc.perform(peticionCreacion().file(stl))
                .andExpect(status().isCreated())
                .andReturn());

        long id = creada.get("id").asLong();
        long archivoId = creada.get("archivos").get(0).get("id").asLong();

        mockMvc.perform(get("/api/cotizaciones/" + id)
                        .header(HttpHeaders.AUTHORIZATION, ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.descripcion",
                        containsString("Figura articulada")))
                .andExpect(jsonPath("$.archivos[0].tipoContenido").value("model/stl"));

        mockMvc.perform(get("/api/cotizaciones/" + id)
                        .header(HttpHeaders.AUTHORIZATION, CLIENTE))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/cotizaciones/archivos/" + archivoId)
                        .header(HttpHeaders.AUTHORIZATION, ADMIN))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("attachment")))
                .andExpect(header().string("Content-Disposition", containsString("ballena.stl")))
                .andExpect(content().bytes("solid ballena".getBytes(StandardCharsets.UTF_8)));

        mockMvc.perform(get("/api/cotizaciones/archivos/" + archivoId)
                        .header(HttpHeaders.AUTHORIZATION, CLIENTE))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/cotizaciones/archivos/" + archivoId))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/cotizaciones/999999")
                        .header(HttpHeaders.AUTHORIZATION, ADMIN))
                .andExpect(status().isNotFound());
    }

    @Test
    void presupuestaYNotificaAlCliente() throws Exception {
        JsonNode creada = leerJson(crearCotizacion());
        long id = creada.get("id").asLong();
        String ticket = creada.get("numeroTicket").asText();

        String cuerpo = """
                {"montoTotal":25980.50,"plazoEntregaDias":7,
                 "observaciones":"Incluye pintura y post procesado"}
                """;

        mockMvc.perform(post("/api/cotizaciones/" + id + "/presupuesto")
                        .header(HttpHeaders.AUTHORIZATION, ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("Presupuestada"))
                .andExpect(jsonPath("$.montoTotal").value(25980.50))
                .andExpect(jsonPath("$.plazoEntregaDias").value(7))
                .andExpect(jsonPath("$.observacionesPresupuesto",
                        containsString("pintura")))
                .andExpect(jsonPath("$.fechaPresupuesto").isNotEmpty())
                .andExpect(jsonPath("$.enlacePago",
                        startsWith("http://localhost:5173/pago-cotizacion?ticket=")));

        verify(correoService, times(1)).enviarPresupuesto(any(Cotizacion.class),
                contains(ticket));

        mockMvc.perform(get("/api/cotizaciones")
                        .header(HttpHeaders.AUTHORIZATION, ADMIN)
                        .param("estado", "Presupuestada"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1));

        mockMvc.perform(post("/api/cotizaciones/" + id + "/presupuesto")
                        .header(HttpHeaders.AUTHORIZATION, CLIENTE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/cotizaciones/" + id + "/presupuesto")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/cotizaciones/" + id + "/presupuesto")
                        .header(HttpHeaders.AUTHORIZATION, ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"montoTotal\":-1,\"plazoEntregaDias\":7}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/cotizaciones/" + id + "/presupuesto")
                        .header(HttpHeaders.AUTHORIZATION, ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"montoTotal\":1000}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/cotizaciones/999999/presupuesto")
                        .header(HttpHeaders.AUTHORIZATION, ADMIN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isNotFound());
    }

    @Test
    void permitePreflightCorsDelFrontend() throws Exception {
        mockMvc.perform(options("/api/cotizaciones")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        "http://localhost:5173"));
    }

    private MockMultipartHttpServletRequestBuilder peticionCreacion() {
        return (MockMultipartHttpServletRequestBuilder) multipart("/api/cotizaciones")
                .param("nombre", "Ana")
                .param("apellido", "Perez")
                .param("correo", "Ana.Perez@Correo.CL")
                .param("telefono", "+56 9 1234 5678")
                .param("categoria", "figuras")
                .param("cantidad", "2")
                .param("plazo", "2")
                .param("descripcion", "Figura articulada personalizada de una ballena");
    }

    private MvcResult crearCotizacion() throws Exception {
        return mockMvc.perform(peticionCreacion())
                .andExpect(status().isCreated())
                .andReturn();
    }

    private JsonNode leerJson(MvcResult resultado) throws Exception {
        return objectMapper.readTree(resultado.getResponse()
                .getContentAsString(StandardCharsets.UTF_8));
    }

    private long contarArchivosEnDisco() throws IOException {
        Path base = Path.of(directorioArchivos);
        if (!Files.exists(base)) {
            return 0;
        }
        try (var rutas = Files.walk(base)) {
            return rutas.filter(Files::isRegularFile).count();
        }
    }

    private void limpiarDirectorio() {
        Path base = Path.of(directorioArchivos);
        if (!Files.exists(base)) {
            return;
        }
        try (var rutas = Files.walk(base)) {
            rutas.sorted(Comparator.reverseOrder()).forEach(ruta -> {
                try {
                    Files.deleteIfExists(ruta);
                } catch (IOException ex) {
                    throw new UncheckedIOException(ex);
                }
            });
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }
}
