package cl.bioforjarc.usuarios.controller;

import cl.bioforjarc.usuarios.dto.LoginRequest;
import cl.bioforjarc.usuarios.dto.LoginResponse;
import cl.bioforjarc.usuarios.dto.MensajeResponse;
import cl.bioforjarc.usuarios.dto.RegistroRequest;
import cl.bioforjarc.usuarios.dto.UsuarioResponse;
import cl.bioforjarc.usuarios.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioService usuarioService;

    public AuthController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @PostMapping("/registro")
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse registrar(@Valid @RequestBody RegistroRequest solicitud) {
        return usuarioService.registrar(solicitud);
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest solicitud) {
        return usuarioService.login(solicitud);
    }

    @GetMapping("/confirmar")
    public MensajeResponse confirmar(@RequestParam String token) {
        return usuarioService.confirmarCorreo(token);
    }
}
