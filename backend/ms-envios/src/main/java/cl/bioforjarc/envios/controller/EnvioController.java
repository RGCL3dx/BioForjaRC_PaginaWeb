package cl.bioforjarc.envios.controller;

import cl.bioforjarc.envios.dto.ComunaResponse;
import cl.bioforjarc.envios.dto.CotizacionRequest;
import cl.bioforjarc.envios.dto.CotizacionResponse;
import cl.bioforjarc.envios.dto.MetodoDespachoResponse;
import cl.bioforjarc.envios.dto.OpcionesEnvioResponse;
import cl.bioforjarc.envios.dto.RegionResponse;
import cl.bioforjarc.envios.service.EnvioService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/envios")
@Validated
public class EnvioController {

    private final EnvioService envioService;

    public EnvioController(EnvioService envioService) {
        this.envioService = envioService;
    }

    /** HU-06.1: regiones disponibles para calcular el envío. */
    @GetMapping("/regiones")
    public List<RegionResponse> listarRegiones() {
        return envioService.listarRegiones();
    }

    @GetMapping("/regiones/{codigo}")
    public RegionResponse obtenerRegion(@PathVariable String codigo) {
        return envioService.obtenerRegion(codigo);
    }

    /** HU-06.1: comunas de una región, para calcular por comuna. */
    @GetMapping("/regiones/{codigo}/comunas")
    public List<ComunaResponse> listarComunas(@PathVariable String codigo) {
        return envioService.listarComunas(codigo);
    }

    /** HU-06.2: Estándar, Express y Retiro. */
    @GetMapping("/metodos-despacho")
    public List<MetodoDespachoResponse> listarMetodos() {
        return envioService.listarMetodos();
    }

    /** HU-06.1: cotización con desglose de productos, envío y total. */
    @PostMapping("/cotizar")
    public CotizacionResponse cotizar(@Valid @RequestBody CotizacionRequest solicitud) {
        return envioService.cotizar(solicitud);
    }

    /**
     * HU-06.2: entrega todas las opciones con su costo para que el checkout
     * pueda actualizar el total sin repetir la lógica de tarifas.
     */
    @GetMapping("/opciones")
    public OpcionesEnvioResponse opciones(
            @RequestParam(required = false) String regionCodigo,
            @RequestParam(required = false) String comuna,
            @RequestParam(defaultValue = "0")
            @DecimalMin(value = "0.0", message = "El subtotal no puede ser negativo")
            @Digits(integer = 10, fraction = 2, message = "El subtotal admite hasta 10 enteros y 2 decimales")
            BigDecimal subtotal) {
        return envioService.opciones(regionCodigo, comuna, subtotal);
    }
}
