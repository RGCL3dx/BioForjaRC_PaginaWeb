package cl.bioforjarc.consultas.controller;

import cl.bioforjarc.consultas.model.Consulta;
import cl.bioforjarc.consultas.repository.ConsultaRepository;
import cl.bioforjarc.consultas.service.CorreoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ConsultaControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ConsultaRepository consultaRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private CorreoService correoService;

    @BeforeEach
    void preparar() {
        consultaRepository.deleteAll();
    }

    @Test
    void enviaConsultaPublicaYNotificaAlAdministrador() throws Exception {
        Map<String, Object> cuerpo = datosValidos();

        mockMvc.perform(post("/api/consultas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(cuerpo)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.nombre").value("Ana Perez"))
                .andExpect(jsonPath("$.correo").value("ana.perez@correo.cl"))
                .andExpect(jsonPath("$.asunto").value("Consulta por maceteros"))
                .andExpect(jsonPath("$.fechaEnvio").isNotEmpty())
                .andExpect(jsonPath("$.mensajeConfirmacion",
                        containsString("administrador")));

        List<Consulta> guardadas = consultaRepository.findAll();
        assertEquals(1, guardadas.size());
        Consulta guardada = guardadas.get(0);
        assertEquals("Ana Perez", guardada.getNombre());
        assertEquals("ana.perez@correo.cl", guardada.getCorreo());
        assertEquals("+56 9 1234 5678", guardada.getTelefono());
        assertEquals("Quisiera saber si tienen maceteros grandes.", guardada.getMensaje());
        assertNotNull(guardada.getFechaEnvio());

        ArgumentCaptor<Consulta> captor = ArgumentCaptor.forClass(Consulta.class);
        verify(correoService).notificarAdministrador(captor.capture());
        assertEquals(guardada.getId(), captor.getValue().getId());
        assertEquals("ana.perez@correo.cl", captor.getValue().getCorreo());
    }

    @Test
    void aceptaTelefonoOmitido() throws Exception {
        Map<String, Object> cuerpo = datosValidos();
        cuerpo.remove("telefono");

        mockMvc.perform(post("/api/consultas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(cuerpo)))
                .andExpect(status().isCreated());

        Consulta guardada = consultaRepository.findAll().get(0);
        assertNull(guardada.getTelefono());
    }

    @Test
    void rechazaCorreoYmensajeObligatorios() throws Exception {
        Map<String, Object> cuerpo = datosValidos();
        cuerpo.put("correo", "");
        cuerpo.put("mensaje", "");

        mockMvc.perform(post("/api/consultas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(cuerpo)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detalles.correo").exists())
                .andExpect(jsonPath("$.detalles.mensaje").exists());

        assertEquals(0, consultaRepository.count());
    }

    @Test
    void rechazaCorreoConFormatoInvalido() throws Exception {
        Map<String, Object> cuerpo = datosValidos();
        cuerpo.put("correo", "no-es-correo");

        mockMvc.perform(post("/api/consultas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(cuerpo)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detalles.correo").exists());
    }

    @Test
    void rechazaMensajeDemasiadoCorto() throws Exception {
        Map<String, Object> cuerpo = datosValidos();
        cuerpo.put("mensaje", "corto");

        mockMvc.perform(post("/api/consultas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(cuerpo)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detalles.mensaje").exists());
    }

    @Test
    void rechazaNombreYAsuntoObligatorios() throws Exception {
        Map<String, Object> cuerpo = datosValidos();
        cuerpo.put("nombre", "  ");
        cuerpo.put("asunto", "");

        mockMvc.perform(post("/api/consultas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(cuerpo)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detalles.nombre").exists())
                .andExpect(jsonPath("$.detalles.asunto").exists());
    }

    @Test
    void rechazaCuerpoMalFormado() throws Exception {
        mockMvc.perform(post("/api/consultas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{no-es-json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").exists());
    }

    @Test
    void permiteCorsDesdeElFrontend() throws Exception {
        mockMvc.perform(options("/api/consultas")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN,
                        "http://localhost:5173"))
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_METHODS,
                        containsString("POST")));
    }

    private Map<String, Object> datosValidos() {
        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("nombre", "  Ana Perez  ");
        cuerpo.put("correo", "  ANA.PEREZ@Correo.CL ");
        cuerpo.put("telefono", "+56 9 1234 5678");
        cuerpo.put("asunto", "  Consulta por maceteros ");
        cuerpo.put("mensaje", "  Quisiera saber si tienen maceteros grandes.  ");
        return cuerpo;
    }

    private byte[] json(Map<String, Object> cuerpo) throws Exception {
        return objectMapper.writeValueAsBytes(cuerpo);
    }
}
