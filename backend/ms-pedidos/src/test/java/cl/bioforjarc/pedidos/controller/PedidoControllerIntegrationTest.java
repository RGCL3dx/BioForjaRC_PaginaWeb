package cl.bioforjarc.pedidos.controller;

import cl.bioforjarc.pedidos.client.CatalogoClient;
import cl.bioforjarc.pedidos.client.CotizacionEnvio;
import cl.bioforjarc.pedidos.client.EnvioClient;
import cl.bioforjarc.pedidos.client.ProductoValidado;
import cl.bioforjarc.pedidos.client.UsuarioClient;
import cl.bioforjarc.pedidos.client.UsuarioValidado;
import cl.bioforjarc.pedidos.repository.PedidoRepository;
import cl.bioforjarc.pedidos.security.JwtTestUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PedidoControllerIntegrationTest {

    private static final String CLIENTE = "cliente@bioforja.cl";
    private static final String ADMIN = "admin@bioforja.cl";
    private static final String AUTORIZACION = "Bearer ";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PedidoRepository pedidoRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private UsuarioClient usuarioClient;

    @MockitoBean
    private CatalogoClient catalogoClient;

    @MockitoBean
    private EnvioClient envioClient;

    @BeforeEach
    void preparar() {
        pedidoRepository.deleteAll();
        lenient().when(usuarioClient.validar(CLIENTE))
                .thenReturn(new UsuarioValidado(true, 7L, CLIENTE, "Ana", "Pérez", true));
        lenient().when(usuarioClient.validar(ADMIN))
                .thenReturn(new UsuarioValidado(true, 1L, ADMIN, "Admin", "BioForja", true));
        lenient().when(catalogoClient.validar(10L, 2))
                .thenReturn(new ProductoValidado(true, 10L, "Figura Ballena",
                        new BigDecimal("5000.00"), 10, true, true, 2));
        lenient().when(catalogoClient.validar(10L, 1))
                .thenReturn(new ProductoValidado(true, 10L, "Figura Ballena",
                        new BigDecimal("5000.00"), 10, true, true, 1));
        lenient().when(envioClient.cotizar("metropolitana", "Santiago", "estandar",
                        new BigDecimal("10000.00")))
                .thenReturn(new CotizacionEnvio("metropolitana", "Región Metropolitana",
                        "Santiago", "estandar", "Envío estándar",
                        new BigDecimal("10000.00"), new BigDecimal("3500.00"),
                        new BigDecimal("13500.00"), 2, true, "REGION"));
        lenient().when(envioClient.cotizar(null, null, "retiro", new BigDecimal("5000.00")))
                .thenReturn(new CotizacionEnvio(null, null, null, "retiro", "Retiro presencial",
                        new BigDecimal("5000.00"), BigDecimal.ZERO,
                        new BigDecimal("5000.00"), 0, false, "FIJO"));
    }

    @Test
    void crearPedidoDevuelveNumeroComprobanteYDesglose() throws Exception {
        MvcResult resultado = crearPedido(JwtTestUtils.tokenCliente(), cuerpoEstandar());

        JsonNode pedido = objectMapper.readTree(
                resultado.getResponse().getContentAsString(StandardCharsets.UTF_8));
        assertEquals("Pagado", pedido.get("estadoPago").asText());
        assertEquals("En preparación", pedido.get("estado").asText());
        assertTrue(pedido.get("numeroOrden").asText().startsWith("BF-"));
        assertEquals(10000.00, pedido.get("subtotal").asDouble());
        assertEquals(3500.00, pedido.get("costoEnvio").asDouble());
        assertEquals(13500.00, pedido.get("total").asDouble());
        assertTrue(pedido.get("pagoSimulado").asBoolean());
        assertEquals("Santiago", pedido.get("comuna").asText());
    }

    @Test
    void crearPedidoRetiroNoExigeDireccion() throws Exception {
        mockMvc.perform(post("/api/pedidos")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoRetiro()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.metodoDespacho").value("retiro"))
                .andExpect(jsonPath("$.costoEnvio").value(0.00))
                .andExpect(jsonPath("$.total").value(5000.00))
                .andExpect(jsonPath("$.requiereDireccion").value(false));
    }

    @Test
    void crearFacturaExigeDatosDeFacturacionYLosGuarda() throws Exception {
        mockMvc.perform(post("/api/pedidos")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoFactura()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.documentoTipo").value("factura"))
                .andExpect(jsonPath("$.rutFacturacion").value("76.543.210-K"))
                .andExpect(jsonPath("$.razonSocial").value("BioForja SpA"));
    }

    @Test
    void facturaSinRutFalla() throws Exception {
        String cuerpo = """
                {
                  "nombre":"Ana","apellido":"Pérez",
                  "documentoTipo":"factura",
                  "direccion":"Av. Siempre Viva 123","comuna":"Santiago",
                  "regionCodigo":"metropolitana","metodoDespacho":"estandar",
                  "metodoPago":"tarjeta","items":[{"productoId":10,"cantidad":2}]
                }
                """;
        mockMvc.perform(post("/api/pedidos")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isBadRequest());
    }

    @Test
    void envioSinDireccionFalla() throws Exception {
        String cuerpo = """
                {
                  "nombre":"Ana","apellido":"Pérez",
                  "documentoTipo":"boleta",
                  "comuna":"Santiago","regionCodigo":"metropolitana",
                  "metodoDespacho":"estandar","metodoPago":"tarjeta",
                  "items":[{"productoId":10,"cantidad":2}]
                }
                """;
        mockMvc.perform(post("/api/pedidos")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value(containsString("dirección")));
    }

    @Test
    void stockInsuficienteEsRechazado() throws Exception {
        when(catalogoClient.validar(10L, 2))
                .thenReturn(new ProductoValidado(true, 10L, "Figura Ballena",
                        new BigDecimal("5000.00"), 1, true, false, 2));

        mockMvc.perform(post("/api/pedidos")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenCliente())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoEstandar()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensaje").value(containsString("Stock insuficiente")));
    }

    @Test
    void historialMuestraPedidosYComprobantePdf() throws Exception {
        crearPedido(JwtTestUtils.tokenCliente(), cuerpoEstandar());
        MvcResult historial = mockMvc.perform(get("/api/pedidos/mios")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenCliente()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].numeroOrden", startsWith("BF-")))
                .andExpect(jsonPath("$[0].estado").value("En preparación"))
                .andExpect(jsonPath("$[0].comprobanteUrl", containsString("/comprobante")))
                .andReturn();
        long id = objectMapper.readTree(historial.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .get(0).get("id").asLong();

        MvcResult pdf = mockMvc.perform(get("/api/pedidos/{id}/comprobante", id)
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenCliente()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn();
        byte[] contenido = pdf.getResponse().getContentAsByteArray();
        assertTrue(contenido.length > 100);
        assertEquals('%', contenido[0]);
        assertEquals('P', contenido[1]);
        assertEquals('D', contenido[2]);
        assertEquals('F', contenido[3]);
    }

    @Test
    void otroClienteNoPuedeVerNiDescargarElPedido() throws Exception {
        crearPedido(JwtTestUtils.tokenCliente(), cuerpoEstandar());
        MvcResult historial = mockMvc.perform(get("/api/pedidos/mios")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenCliente()))
                .andReturn();
        long id = objectMapper.readTree(historial.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .get(0).get("id").asLong();

        mockMvc.perform(get("/api/pedidos/{id}", id)
                        .header("Authorization", AUTORIZACION
                                + JwtTestUtils.token("otro@bioforja.cl", "CLIENTE")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/pedidos/{id}/comprobante", id)
                        .header("Authorization", AUTORIZACION
                                + JwtTestUtils.token("otro@bioforja.cl", "CLIENTE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void administradorListaYCambiaEstado() throws Exception {
        crearPedido(JwtTestUtils.tokenCliente(), cuerpoEstandar());

        MvcResult listado = mockMvc.perform(get("/api/pedidos")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenAdmin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1))
                .andExpect(jsonPath("$.contenido[0].estado").value("En preparación"))
                .andReturn();
        long id = objectMapper.readTree(listado.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .get("contenido").get(0).get("id").asLong();

        mockMvc.perform(patch("/api/pedidos/{id}/estado", id)
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenAdmin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"estado\":\"Despachado\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.estado").value("Despachado"));

        mockMvc.perform(get("/api/pedidos")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenAdmin())
                        .param("estado", "Despachado"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElementos").value(1));
    }

    @Test
    void clienteNoPuedeAccederAlPanelAdministrativo() throws Exception {
        mockMvc.perform(get("/api/pedidos")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenCliente()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/reportes/ventas")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenCliente()))
                .andExpect(status().isForbidden());
    }

    @Test
    void reporteVentasIncluyeIndicadoresYExportaExcelYPdf() throws Exception {
        crearPedido(JwtTestUtils.tokenCliente(), cuerpoEstandar());
        String hoy = LocalDate.now().toString();

        mockMvc.perform(get("/api/reportes/ventas")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenAdmin())
                        .param("desde", hoy)
                        .param("hasta", hoy))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalVentas").value(13500.00))
                .andExpect(jsonPath("$.cantidadPedidos").value(1))
                .andExpect(jsonPath("$.unidadesVendidas").value(2))
                .andExpect(jsonPath("$.topProductos[0].productoId").value(10))
                .andExpect(jsonPath("$.topProductos[0].unidades").value(2));

        MvcResult excel = mockMvc.perform(get("/api/reportes/ventas/exportar")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenAdmin())
                        .param("desde", hoy)
                        .param("hasta", hoy)
                        .param("formato", "xlsx"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString(".xlsx")))
                .andReturn();
        byte[] xlsx = excel.getResponse().getContentAsByteArray();
        assertEquals('P', xlsx[0]);
        assertEquals('K', xlsx[1]);

        MvcResult pdf = mockMvc.perform(get("/api/reportes/ventas/exportar")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenAdmin())
                        .param("desde", hoy)
                        .param("hasta", hoy)
                        .param("formato", "pdf"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn();
        byte[] pdfBytes = pdf.getResponse().getContentAsByteArray();
        assertEquals('%', pdfBytes[0]);
        assertEquals('P', pdfBytes[1]);
        assertEquals('D', pdfBytes[2]);
        assertEquals('F', pdfBytes[3]);
    }

    @Test
    void seguridadYValidacionesBasicas() throws Exception {
        mockMvc.perform(post("/api/pedidos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpoEstandar()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/pedidos/mios")
                        .header("Authorization", "Bearer token-invalido"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/reportes/ventas/exportar")
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenAdmin())
                        .param("formato", "csv"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/pedidos/{id}", 999999)
                        .header("Authorization", AUTORIZACION + JwtTestUtils.tokenAdmin()))
                .andExpect(status().isNotFound());

        mockMvc.perform(options("/api/pedidos")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin",
                        containsString("http://localhost:5173")));
    }

    private MvcResult crearPedido(String token, String cuerpo) throws Exception {
        return mockMvc.perform(post("/api/pedidos")
                        .header("Authorization", AUTORIZACION + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(cuerpo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.numeroOrden", startsWith("BF-")))
                .andReturn();
    }

    private String cuerpoEstandar() {
        return """
                {
                  "nombre":"Ana","apellido":"Pérez","telefono":"+56912345678",
                  "rut":"12.345.678-5","documentoTipo":"boleta",
                  "direccion":"Av. Siempre Viva 123","comuna":"Santiago",
                  "regionCodigo":"metropolitana","metodoDespacho":"estandar",
                  "metodoPago":"tarjeta",
                  "items":[{"productoId":10,"cantidad":2}]
                }
                """;
    }

    private String cuerpoRetiro() {
        return """
                {
                  "nombre":"Ana","apellido":"Pérez","documentoTipo":"boleta",
                  "metodoDespacho":"retiro","metodoPago":"transferencia",
                  "items":[{"productoId":10,"cantidad":1}]
                }
                """;
    }

    private String cuerpoFactura() {
        return """
                {
                  "nombre":"Ana","apellido":"Pérez","documentoTipo":"factura",
                  "rutFacturacion":"76.543.210-K","razonSocial":"BioForja SpA",
                  "giro":"Comercio","direccion":"Av. Siempre Viva 123",
                  "comuna":"Santiago","regionCodigo":"metropolitana",
                  "metodoDespacho":"estandar","metodoPago":"transferencia",
                  "items":[{"productoId":10,"cantidad":2}]
                }
                """;
    }
}
