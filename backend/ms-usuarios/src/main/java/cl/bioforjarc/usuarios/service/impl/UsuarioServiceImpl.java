package cl.bioforjarc.usuarios.service.impl;

import cl.bioforjarc.usuarios.dto.EstadoRequest;
import cl.bioforjarc.usuarios.dto.LoginRequest;
import cl.bioforjarc.usuarios.dto.LoginResponse;
import cl.bioforjarc.usuarios.dto.MensajeResponse;
import cl.bioforjarc.usuarios.dto.RegistroRequest;
import cl.bioforjarc.usuarios.dto.UsuarioActualizacionRequest;
import cl.bioforjarc.usuarios.dto.UsuarioResponse;
import cl.bioforjarc.usuarios.dto.ValidacionUsuarioResponse;
import cl.bioforjarc.usuarios.exception.ConflictoException;
import cl.bioforjarc.usuarios.exception.CredencialesInvalidasException;
import cl.bioforjarc.usuarios.exception.CuentaInactivaException;
import cl.bioforjarc.usuarios.exception.OperacionNoPermitidaException;
import cl.bioforjarc.usuarios.exception.RecursoNoEncontradoException;
import cl.bioforjarc.usuarios.model.EstadoUsuario;
import cl.bioforjarc.usuarios.model.Rol;
import cl.bioforjarc.usuarios.model.Usuario;
import cl.bioforjarc.usuarios.repository.UsuarioRepository;
import cl.bioforjarc.usuarios.security.JwtService;
import cl.bioforjarc.usuarios.service.CorreoService;
import cl.bioforjarc.usuarios.service.UsuarioService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional
public class UsuarioServiceImpl implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final CorreoService correoService;

    public UsuarioServiceImpl(UsuarioRepository usuarioRepository,
                              PasswordEncoder passwordEncoder,
                              JwtService jwtService,
                              CorreoService correoService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.correoService = correoService;
    }

    @Override
    public UsuarioResponse registrar(RegistroRequest solicitud) {
        String correo = normalizarCorreo(solicitud.correo());
        if (usuarioRepository.existsByCorreoIgnoreCase(correo)) {
            throw new ConflictoException("Ya existe una cuenta registrada con el correo " + correo);
        }

        Usuario usuario = new Usuario();
        usuario.setNombre(limpiar(solicitud.nombre()));
        usuario.setApellido(limpiar(solicitud.apellido()));
        usuario.setRut(limpiarMayusculas(solicitud.rut()));
        usuario.setCorreo(correo);
        usuario.setTelefono(limpiarONulo(solicitud.telefono()));
        usuario.setClaveHash(passwordEncoder.encode(solicitud.clave()));
        usuario.setRol(Rol.CLIENTE);
        usuario.setEstado(EstadoUsuario.ACTIVO);
        usuario.setFechaRegistro(LocalDateTime.now());
        usuario.setCorreoConfirmado(false);
        usuario.setTokenConfirmacion(UUID.randomUUID().toString().replace("-", ""));

        Usuario guardado = usuarioRepository.save(usuario);
        correoService.enviarConfirmacion(guardado, guardado.getTokenConfirmacion());
        return UsuarioResponse.desde(guardado);
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest solicitud) {
        String correo = normalizarCorreo(solicitud.correo());
        Usuario usuario = usuarioRepository.findByCorreoIgnoreCase(correo)
                .orElseThrow(() -> new CredencialesInvalidasException("Correo o contraseña incorrectos"));

        if (!passwordEncoder.matches(solicitud.clave(), usuario.getClaveHash())) {
            throw new CredencialesInvalidasException("Correo o contraseña incorrectos");
        }
        if (usuario.getEstado() != EstadoUsuario.ACTIVO) {
            throw new CuentaInactivaException("La cuenta está desactivada. Contacte a un administrador");
        }

        String token = jwtService.generarToken(usuario);
        return new LoginResponse(token, "Bearer", jwtService.getExpiracionSegundos(),
                UsuarioResponse.desde(usuario));
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar(String busqueda) {
        List<Usuario> usuarios;
        if (busqueda == null || busqueda.isBlank()) {
            usuarios = usuarioRepository.findAllByOrderByFechaRegistroDesc();
        } else {
            String filtro = busqueda.trim();
            usuarios = usuarioRepository
                    .findByCorreoContainingIgnoreCaseOrNombreContainingIgnoreCaseOrApellidoContainingIgnoreCaseOrderByFechaRegistroDesc(
                            filtro, filtro, filtro);
        }
        return usuarios.stream().map(UsuarioResponse::desde).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id, boolean esAdministrador, String correoAutenticado) {
        Usuario usuario = buscarUsuario(id);
        if (!esAdministrador && !mismoCorreo(usuario.getCorreo(), correoAutenticado)) {
            throw new OperacionNoPermitidaException("Solo puede consultar su propia cuenta");
        }
        return UsuarioResponse.desde(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public ValidacionUsuarioResponse validarPorCorreo(String correo) {
        String normalizado = normalizarCorreo(correo);
        return usuarioRepository.findByCorreoIgnoreCase(normalizado)
                .map(ValidacionUsuarioResponse::desde)
                .orElseGet(() -> ValidacionUsuarioResponse.inexistente(normalizado));
    }

    @Override
    public UsuarioResponse actualizar(Long id, UsuarioActualizacionRequest solicitud,
                                      boolean esAdministrador, String correoAutenticado) {
        Usuario usuario = buscarUsuario(id);

        if (!esAdministrador && !mismoCorreo(usuario.getCorreo(), correoAutenticado)) {
            throw new OperacionNoPermitidaException("Solo puede modificar su propia cuenta");
        }

        String nuevoCorreo = normalizarCorreo(solicitud.correo());
        usuarioRepository.findByCorreoIgnoreCase(nuevoCorreo)
                .filter(otro -> !otro.getId().equals(id))
                .ifPresent(otro -> {
                    throw new ConflictoException("Ya existe una cuenta con el correo " + nuevoCorreo);
                });

        if (solicitud.rol() != null) {
            if (!esAdministrador && solicitud.rol() != usuario.getRol()) {
                throw new OperacionNoPermitidaException("Solo un administrador puede cambiar el rol");
            }
            usuario.setRol(solicitud.rol());
        }

        usuario.setNombre(limpiar(solicitud.nombre()));
        usuario.setApellido(limpiar(solicitud.apellido()));
        usuario.setRut(limpiarMayusculas(solicitud.rut()));
        usuario.setCorreo(nuevoCorreo);
        usuario.setTelefono(limpiarONulo(solicitud.telefono()));

        return UsuarioResponse.desde(usuarioRepository.save(usuario));
    }

    @Override
    public UsuarioResponse cambiarEstado(Long id, EstadoRequest solicitud) {
        Usuario usuario = buscarUsuario(id);
        usuario.setEstado(solicitud.estado());
        return UsuarioResponse.desde(usuarioRepository.save(usuario));
    }

    @Override
    public MensajeResponse confirmarCorreo(String token) {
        if (token == null || token.isBlank()) {
            throw new RecursoNoEncontradoException("El enlace de confirmación no es válido");
        }
        Usuario usuario = usuarioRepository.findByTokenConfirmacion(token)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "El enlace de confirmación no es válido o ya fue utilizado"));

        usuario.setCorreoConfirmado(true);
        usuario.setTokenConfirmacion(null);
        usuarioRepository.save(usuario);
        return new MensajeResponse("Correo confirmado correctamente");
    }

    private Usuario buscarUsuario(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un usuario con id " + id));
    }

    private boolean mismoCorreo(String uno, String otro) {
        return otro != null && uno != null && uno.equalsIgnoreCase(otro.trim());
    }

    private String normalizarCorreo(String correo) {
        return correo == null ? "" : correo.trim().toLowerCase(Locale.ROOT);
    }

    private String limpiar(String valor) {
        return valor == null ? null : valor.trim();
    }

    private String limpiarMayusculas(String valor) {
        return valor == null ? null : valor.trim().toUpperCase(Locale.ROOT);
    }

    private String limpiarONulo(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}
