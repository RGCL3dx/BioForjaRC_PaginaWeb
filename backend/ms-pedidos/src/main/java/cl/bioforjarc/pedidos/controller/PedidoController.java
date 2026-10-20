package cl.bioforjarc.pedidos.controller;

import cl.bioforjarc.pedidos.dto.CrearPedidoRequest;
import cl.bioforjarc.pedidos.dto.EstadoPedidoRequest;
import cl.bioforjarc.pedidos.dto.PaginaResponse;
import cl.bioforjarc.pedidos.dto.PedidoDetalleResponse;
import cl.bioforjarc.pedidos.dto.PedidoResumenResponse;
import cl.bioforjarc.pedidos.model.Pedido;
import cl.bioforjarc.pedidos.security.AccesoUtils;
import cl.bioforjarc.pedidos.service.ComprobanteService;
import cl.bioforjarc.pedidos.service.PedidoService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
@Validated
public class PedidoController {

    private final PedidoService pedidoService;
    private final ComprobanteService comprobanteService;

    public PedidoController(PedidoService pedidoService,
                            ComprobanteService comprobanteService) {
        this.pedidoService = pedidoService;
        this.comprobanteService = comprobanteService;
    }

    /** HU-03.1 y HU-03.2: checkout, pago simulado y comprobante. */
    @PostMapping
    public PedidoDetalleResponse crear(@Valid @RequestBody CrearPedidoRequest solicitud,
                                       Authentication autenticacion) {
        return pedidoService.crear(solicitud,
                AccesoUtils.correoAutenticado(autenticacion));
    }

    /** HU-09.1: historial del cliente autenticado. */
    @GetMapping("/mios")
    public List<PedidoResumenResponse> listarMios(Authentication autenticacion) {
        return pedidoService.listarMios(AccesoUtils.correoAutenticado(autenticacion));
    }

    /** HU-09.1: listado administrativo con filtros y paginación. */
    @GetMapping
    public PaginaResponse<PedidoResumenResponse> listarAdmin(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(defaultValue = "0") @Min(value = 0, message = "La página no puede ser negativa")
            int pagina,
            @RequestParam(defaultValue = "20")
            @Min(value = 1, message = "El tamaño mínimo es 1")
            @Max(value = 100, message = "El tamaño máximo es 100") int tamano) {
        return pedidoService.listarAdmin(q, estado, desde, hasta, pagina, tamano);
    }

    /** HU-09.1: detalle de un pedido propio o de cualquier pedido si es admin. */
    @GetMapping("/{id}")
    public PedidoDetalleResponse obtener(@PathVariable Long id, Authentication autenticacion) {
        return pedidoService.obtener(id,
                AccesoUtils.correoAutenticado(autenticacion),
                AccesoUtils.esAdministrador(autenticacion));
    }

    /** Actualización del estado de despacho por parte del administrador. */
    @PatchMapping("/{id}/estado")
    public PedidoDetalleResponse cambiarEstado(@PathVariable Long id,
                                               @Valid @RequestBody EstadoPedidoRequest solicitud) {
        return pedidoService.cambiarEstado(id, solicitud.estado());
    }

    /** HU-09.1: descarga del comprobante en PDF. */
    @GetMapping("/{id}/comprobante")
    public ResponseEntity<byte[]> comprobante(@PathVariable Long id, Authentication autenticacion) {
        Pedido pedido = pedidoService.obtenerEntidadAutorizada(
                id,
                AccesoUtils.correoAutenticado(autenticacion),
                AccesoUtils.esAdministrador(autenticacion));
        byte[] archivo = comprobanteService.generar(pedido);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename("comprobante-" + pedido.getNumeroOrden() + ".pdf", StandardCharsets.UTF_8)
                .build());
        return new ResponseEntity<>(archivo, headers, HttpStatus.OK);
    }
}
