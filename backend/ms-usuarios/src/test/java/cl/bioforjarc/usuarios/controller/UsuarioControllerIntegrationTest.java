package cl.bioforjarc.usuarios.controller;

import cl.bioforjarc.usuarios.model.Usuario;
import cl.bioforjarc.usuarios.repository.UsuarioRepository;
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

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
class UsuarioControllerIntegrationTest {

    private static final String ADMIN_CORREO = "admin@bioforjarc.cl";
    private static final String ADMIN_CLAVE = "Admin123";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void registroLoginYObtenerPerfilPropio() throws Exception {
        String correo = correoUnico();
        String token = registrarYLogin(correo, "Clave1234");

        mockMvc.perform(get("/api/usuarios/1"))
                .andExpect(status().isUnauthorized());

        MvcResult resultado = mockMvc.perform(get("/api/usuarios/{id}", idDe(correo))
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correo").value(correo))
                .andExpect(jsonPath("$.rol").value("cliente"))
                .andExpect(jsonPath("$.estado").value("Activo"))
                .andExpect(jsonPath("$.clave").doesNotExist())
                .andExpect(jsonPath("$.claveHash").doesNotExist())
                .andReturn();

        assertFalse(resultado.getResponse().getContentAsString().contains("Clave1234"));
    }

    @Test
    void registroRechazaCorreoDuplicadoYClaveDebil() throws Exception {
        String correo = correoUnico();
        registrar(correo, "Clave1234");

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoRegistro(correo, "Clave1234")))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoRegistro(correoUnico(), "debil")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detalles.clave").exists());
    }

    @Test
    void loginRechazaCredencialesInvalidas() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"correo":"%s","clave":"ClaveIncorrecta1"}
                                """.formatted(ADMIN_CORREO)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void validarEsPublicoYDevuelveEstadoDelCliente() throws Exception {
        mockMvc.perform(get("/api/usuarios/validar").param("correo", ADMIN_CORREO))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.existe").value(true))
                .andExpect(jsonPath("$.activo").value(true))
                .andExpect(jsonPath("$.estado").value("Activo"))
                .andExpect(jsonPath("$.clave").doesNotExist());

        mockMvc.perform(get("/api/usuarios/validar").param("correo", "nadie@correo.cl"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.existe").value(false))
                .andExpect(jsonPath("$.activo").value(false));
    }

    @Test
    void listarUsuariosRequiereAdministrador() throws Exception {
        String correo = correoUnico();
        String tokenCliente = registrarYLogin(correo, "Clave1234");
        String tokenAdmin = token(ADMIN_CORREO, ADMIN_CLAVE);

        mockMvc.perform(get("/api/usuarios"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/usuarios")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/usuarios")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].correo").exists());
    }

    @Test
    void administradorDesactivaYReactivaUnaCuenta() throws Exception {
        String correo = correoUnico();
        String tokenCliente = registrarYLogin(correo, "Clave1234");
        long id = idDe(correo);
        String tokenAdmin = token(ADMIN_CORREO, ADMIN_CLAVE);

        mockMvc.perform(patch("/api/usuarios/{id}/estado", id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"estado":"Inactivo"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("Inactivo"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"correo":"%s","clave":"Clave1234"}
                                """.formatted(correo)))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch("/api/usuarios/{id}/estado", id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenAdmin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"estado":"Activo"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("Activo"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"correo":"%s","clave":"Clave1234"}
                                """.formatted(correo)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        assertNotNull(tokenCliente);
    }

    @Test
    void clienteNoPuedeCambiarSuRolPeroAdministradorSi() throws Exception {
        String correo = correoUnico();
        String tokenCliente = registrarYLogin(correo, "Clave1234");
        long id = idDe(correo);

        mockMvc.perform(put("/api/usuarios/{id}", id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenCliente)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoActualizacion(correo, "administrador")))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/usuarios/{id}", id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token(ADMIN_CORREO, ADMIN_CLAVE))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoActualizacion(correo, "administrador")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rol").value("administrador"));
    }

    @Test
    void direccionesSeCreanListanActualizanYElminan() throws Exception {
        String correo = correoUnico();
        String token = registrarYLogin(correo, "Clave1234");
        long id = idDe(correo);

        MvcResult creada = mockMvc.perform(post("/api/usuarios/{id}/direcciones", id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoDireccion("Av. Uno", "111", true)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.principal").value(true))
                .andReturn();

        long primeraId = objectMapper.readTree(creada.getResponse().getContentAsString()).get("id").asLong();

        MvcResult segunda = mockMvc.perform(post("/api/usuarios/{id}/direcciones", id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoDireccion("Calle Dos", "222", false)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.principal").value(false))
                .andReturn();

        long segundaId = objectMapper.readTree(segunda.getResponse().getContentAsString()).get("id").asLong();

        mockMvc.perform(get("/api/usuarios/{id}/direcciones", id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(patch("/api/usuarios/{id}/direcciones/{dir}/principal", id, segundaId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.principal").value(true));

        mockMvc.perform(put("/api/usuarios/{id}/direcciones/{dir}", id, primeraId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoDireccion("Av. Uno Bis", "333", false)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.calle").value("Av. Uno Bis"))
                .andExpect(jsonPath("$.numero").value("333"));

        mockMvc.perform(delete("/api/usuarios/{id}/direcciones/{dir}", id, segundaId)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/usuarios/{id}/direcciones", id)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].principal").value(true));
    }

    @Test
    void confirmacionDeCorreoConsumeElToken() throws Exception {
        String correo = correoUnico();
        registrar(correo, "Clave1234");

        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correo).orElseThrow();
        String tokenConfirmacion = usuario.getTokenConfirmacion();
        assertNotNull(tokenConfirmacion);
        assertFalse(usuario.isCorreoConfirmado());

        mockMvc.perform(get("/api/auth/confirmar").param("token", tokenConfirmacion))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mensaje").value("Correo confirmado correctamente"));

        Usuario confirmado = usuarioRepository.findByCorreoIgnoreCase(correo).orElseThrow();
        assertTrue(confirmado.isCorreoConfirmado());
        assertNull(confirmado.getTokenConfirmacion());

        mockMvc.perform(get("/api/auth/confirmar").param("token", tokenConfirmacion))
                .andExpect(status().isNotFound());
    }

    private String registrarYLogin(String correo, String clave) throws Exception {
        registrar(correo, clave);
        return token(correo, clave);
    }

    private void registrar(String correo, String clave) throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoRegistro(correo, clave)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.correo").value(correo))
                .andExpect(jsonPath("$.clave").doesNotExist())
                .andExpect(jsonPath("$.claveHash").doesNotExist());
    }

    private String token(String correo, String clave) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"correo":"%s","clave":"%s"}
                                """.formatted(correo, clave)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn();
        return objectMapper.readTree(resultado.getResponse().getContentAsString()).get("token").asText();
    }

    private long idDe(String correo) {
        return usuarioRepository.findByCorreoIgnoreCase(correo).orElseThrow().getId();
    }

    private String correoUnico() {
        return "prueba." + UUID.randomUUID().toString().substring(0, 8) + "@correo.cl";
    }

    private String cuerpoRegistro(String correo, String clave) {
        return """
                {
                  "nombre":"Ana",
                  "apellido":"Pérez",
                  "rut":"12.345.678-9",
                  "correo":"%s",
                  "telefono":"+56 9 1111 2222",
                  "clave":"%s"
                }
                """.formatted(correo, clave);
    }

    private String cuerpoActualizacion(String correo, String rol) {
        return """
                {
                  "nombre":"Ana",
                  "apellido":"Pérez",
                  "rut":"12.345.678-9",
                  "correo":"%s",
                  "telefono":"+56 9 1111 2222",
                  "rol":"%s"
                }
                """.formatted(correo, rol);
    }

    private String cuerpoDireccion(String calle, String numero, boolean principal) {
        return """
                {
                  "region":"Región Metropolitana",
                  "comuna":"Santiago Centro",
                  "calle":"%s",
                  "numero":"%s",
                  "departamento":"",
                  "referencia":"Prueba",
                  "principal":%s
                }
                """.formatted(calle, numero, principal);
    }
}
