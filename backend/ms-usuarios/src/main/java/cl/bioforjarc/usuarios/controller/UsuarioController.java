package cl.bioforjarc.usuarios.controller;

import cl.bioforjarc.usuarios.dto.EstadoRequest;
import cl.bioforjarc.usuarios.dto.UsuarioActualizacionRequest;
import cl.bioforjarc.usuarios.dto.UsuarioResponse;
import cl.bioforjarc.usuarios.dto.ValidacionUsuarioResponse;
import cl.bioforjarc.usuarios.security.AccesoUtils;
import cl.bioforjarc.usuarios.service.UsuarioService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@Validated
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    /**
     * HU-02.3: listado centralizado con buscador por correo, nombre o apellido.
     * Solo accesible con rol administrador.
     */
    @GetMapping
    public List<UsuarioResponse> listar(@RequestParam(required = false) String q) {
        return usuarioService.listar(q);
    }

    /**
     * Endpoint interno para ms-pedidos: valida existencia y estado del cliente.
     */
    @GetMapping("/validar")
    public ValidacionUsuarioResponse validar(
            @RequestParam @NotBlank(message = "El correo es obligatorio") String correo) {
        return usuarioService.validarPorCorreo(correo);
    }

    @GetMapping("/{id}")
    public UsuarioResponse obtener(@PathVariable Long id, Authentication autenticacion) {
        return usuarioService.obtener(id, AccesoUtils.esAdministrador(autenticacion),
                AccesoUtils.correoAutenticado(autenticacion));
    }

    @PutMapping("/{id}")
    public UsuarioResponse actualizar(@PathVariable Long id,
                                      @Valid @RequestBody UsuarioActualizacionRequest solicitud,
                                      Authentication autenticacion) {
        return usuarioService.actualizar(id, solicitud, AccesoUtils.esAdministrador(autenticacion),
                AccesoUtils.correoAutenticado(autenticacion));
    }

    /**
     * HU-02.3: activar o desactivar una cuenta sin eliminarla.
     */
    @PatchMapping("/{id}/estado")
    public UsuarioResponse cambiarEstado(@PathVariable Long id,
                                         @Valid @RequestBody EstadoRequest solicitud) {
        return usuarioService.cambiarEstado(id, solicitud);
    }
}
