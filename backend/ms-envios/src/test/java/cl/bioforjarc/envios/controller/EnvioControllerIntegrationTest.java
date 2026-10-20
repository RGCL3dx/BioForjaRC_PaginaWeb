package cl.bioforjarc.envios.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EnvioControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void regionesYComunasSonPublicas() throws Exception {
        mockMvc.perform(get("/api/envios/regiones"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(16))
                .andExpect(jsonPath("$[0].codigo").value("arica"))
                .andExpect(jsonPath("$[6].codigo").value("metropolitana"))
                .andExpect(jsonPath("$[6].comunas.length()").value(10));

        mockMvc.perform(get("/api/envios/regiones/metropolitana/comunas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(10))
                .andExpect(jsonPath("$[?(@.slug == 'santiago')].nombre", hasItem("Santiago")));

        mockMvc.perform(get("/api/envios/regiones/libgral"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value("ohiggins"))
                .andExpect(jsonPath("$.nombre").value("O'Higgins"));
    }

    @Test
    void metodosDespachoDespliegaEstandarExpressYRetiro() throws Exception {
        mockMvc.perform(get("/api/envios/metodos-despacho"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].codigo").value("estandar"))
                .andExpect(jsonPath("$[0].requiereDireccion").value(true))
                .andExpect(jsonPath("$[1].codigo").value("express"))
                .andExpect(jsonPath("$[2].codigo").value("retiro"))
                .andExpect(jsonPath("$[2].requiereDireccion").value(false));
    }

    @Test
    void cotizarEstandarMetropolitanaMuestraDesglose() throws Exception {
        mockMvc.perform(post("/api/envios/cotizar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"regionCodigo":"metropolitana","metodoCodigo":"estandar","subtotal":10000}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.regionCodigo").value("metropolitana"))
                .andExpect(jsonPath("$.metodoCodigo").value("estandar"))
                .andExpect(jsonPath("$.subtotal").value(10000.00))
                .andExpect(jsonPath("$.costoEnvio").value(3500.00))
                .andExpect(jsonPath("$.total").value(13500.00))
                .andExpect(jsonPath("$.diasHabiles").value(2))
                .andExpect(jsonPath("$.origenTarifa").value("REGION"))
                .andExpect(jsonPath("$.requiereDireccion").value(true));
    }

    @Test
    void cotizarExpressActualizaTotal() throws Exception {
        mockMvc.perform(post("/api/envios/cotizar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"regionCodigo":"metropolitana","metodoCodigo":"express","subtotal":10000}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.costoEnvio").value(6500.00))
                .andExpect(jsonPath("$.total").value(16500.00))
                .andExpect(jsonPath("$.diasHabiles").value(1));
    }

    @Test
    void cotizarComunaConExcepcionUsaTarifaDeComuna() throws Exception {
        mockMvc.perform(post("/api/envios/cotizar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"regionCodigo":"valparaiso","comuna":"Isla de Pascua",
                                 "metodoCodigo":"estandar","subtotal":5000}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comuna").value("Isla de Pascua"))
                .andExpect(jsonPath("$.costoEnvio").value(12000.00))
                .andExpect(jsonPath("$.total").value(17000.00))
                .andExpect(jsonPath("$.diasHabiles").value(6))
                .andExpect(jsonPath("$.origenTarifa").value("COMUNA"));
    }

    @Test
    void cotizarRetiroNoRequiereRegion() throws Exception {
        mockMvc.perform(post("/api/envios/cotizar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"metodoCodigo":"retiro","subtotal":8990}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metodoCodigo").value("retiro"))
                .andExpect(jsonPath("$.costoEnvio").value(0.00))
                .andExpect(jsonPath("$.total").value(8990.00))
                .andExpect(jsonPath("$.origenTarifa").value("FIJO"))
                .andExpect(jsonPath("$.requiereDireccion").value(false))
                .andExpect(jsonPath("$.regionCodigo").doesNotExist());
    }

    @Test
    void cotizarSoloConComunaCalculaUsandoSuRegion() throws Exception {
        mockMvc.perform(post("/api/envios/cotizar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"comuna":"Santiago","metodoCodigo":"estandar","subtotal":10000}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.regionCodigo").value("metropolitana"))
                .andExpect(jsonPath("$.costoEnvio").value(3500.00))
                .andExpect(jsonPath("$.total").value(13500.00))
                .andExpect(jsonPath("$.origenTarifa").value("REGION"));

        mockMvc.perform(get("/api/envios/opciones")
                        .param("comuna", "Santiago")
                        .param("subtotal", "10000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.regionCodigo").value("metropolitana"))
                .andExpect(jsonPath("$.opciones.length()").value(3));
    }

    @Test
    void opcionesDevuelveTodosLosMetodosConTotalActualizado() throws Exception {
        mockMvc.perform(get("/api/envios/opciones")
                        .param("regionCodigo", "metropolitana")
                        .param("subtotal", "10000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.opciones.length()").value(3))
                .andExpect(jsonPath("$.opciones[0].metodoCodigo").value("estandar"))
                .andExpect(jsonPath("$.opciones[0].costoEnvio").value(3500.00))
                .andExpect(jsonPath("$.opciones[0].total").value(13500.00))
                .andExpect(jsonPath("$.opciones[1].metodoCodigo").value("express"))
                .andExpect(jsonPath("$.opciones[1].total").value(16500.00))
                .andExpect(jsonPath("$.opciones[2].metodoCodigo").value("retiro"))
                .andExpect(jsonPath("$.opciones[2].costoEnvio").value(0.00))
                .andExpect(jsonPath("$.opciones[2].total").value(10000.00));
    }

    @Test
    void cotizacionInvalidaDevuelve400() throws Exception {
        mockMvc.perform(post("/api/envios/cotizar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"metodoCodigo":"estandar","subtotal":1000}
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/envios/cotizar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"regionCodigo":"metropolitana","metodoCodigo":"no-existe"}
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/envios/cotizar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"regionCodigo":"metropolitana","metodoCodigo":"estandar","subtotal":-1}
                                """))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/envios/opciones"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void regionInexistenteDevuelve404() throws Exception {
        mockMvc.perform(get("/api/envios/regiones/no-existe"))
                .andExpect(status().isNotFound());
    }

    @Test
    void preflightCorsDesdeFrontendRespondeOk() throws Exception {
        mockMvc.perform(options("/api/envios/cotizar")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin",
                        containsString("http://localhost:5173")));
    }
}
