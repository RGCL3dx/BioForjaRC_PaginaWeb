package cl.bioforjarc.usuarios.controller;

import cl.bioforjarc.usuarios.dto.DireccionRequest;
import cl.bioforjarc.usuarios.dto.DireccionResponse;
import cl.bioforjarc.usuarios.security.AccesoUtils;
import cl.bioforjarc.usuarios.service.DireccionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios/{usuarioId}/direcciones")
public class DireccionController {

    private final DireccionService direccionService;

    public DireccionController(DireccionService direccionService) {
        this.direccionService = direccionService;
    }

    @GetMapping
    public List<DireccionResponse> listar(@PathVariable Long usuarioId, Authentication autenticacion) {
        return direccionService.listar(usuarioId, AccesoUtils.esAdministrador(autenticacion),
                AccesoUtils.correoAutenticado(autenticacion));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DireccionResponse crear(@PathVariable Long usuarioId,
                                   @Valid @RequestBody DireccionRequest solicitud,
                                   Authentication autenticacion) {
        return direccionService.crear(usuarioId, solicitud, AccesoUtils.esAdministrador(autenticacion),
                AccesoUtils.correoAutenticado(autenticacion));
    }

    @PutMapping("/{direccionId}")
    public DireccionResponse actualizar(@PathVariable Long usuarioId,
                                        @PathVariable Long direccionId,
                                        @Valid @RequestBody DireccionRequest solicitud,
                                        Authentication autenticacion) {
        return direccionService.actualizar(usuarioId, direccionId, solicitud,
                AccesoUtils.esAdministrador(autenticacion),
                AccesoUtils.correoAutenticado(autenticacion));
    }

    @DeleteMapping("/{direccionId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void eliminar(@PathVariable Long usuarioId,
                         @PathVariable Long direccionId,
                         Authentication autenticacion) {
        direccionService.eliminar(usuarioId, direccionId, AccesoUtils.esAdministrador(autenticacion),
                AccesoUtils.correoAutenticado(autenticacion));
    }

    @PatchMapping("/{direccionId}/principal")
    public DireccionResponse marcarPrincipal(@PathVariable Long usuarioId,
                                             @PathVariable Long direccionId,
                                             Authentication autenticacion) {
        return direccionService.marcarPrincipal(usuarioId, direccionId,
                AccesoUtils.esAdministrador(autenticacion),
                AccesoUtils.correoAutenticado(autenticacion));
    }
}
