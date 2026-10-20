package cl.bioforjarc.consultas.controller;

import cl.bioforjarc.consultas.dto.ConsultaRequest;
import cl.bioforjarc.consultas.dto.ConsultaResponse;
import cl.bioforjarc.consultas.service.ConsultaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/consultas")
public class ConsultaController {

    private final ConsultaService consultaService;

    public ConsultaController(ConsultaService consultaService) {
        this.consultaService = consultaService;
    }

    /**
     * HU-05.1: formulario publico de contacto. Valida correo y mensaje,
     * guarda la consulta y notifica al administrador por correo.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ConsultaResponse enviar(@Valid @RequestBody ConsultaRequest solicitud) {
        return consultaService.enviar(solicitud);
    }
}
