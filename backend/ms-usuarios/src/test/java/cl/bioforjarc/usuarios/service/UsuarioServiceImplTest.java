package cl.bioforjarc.usuarios.service;

import cl.bioforjarc.usuarios.dto.EstadoRequest;
import cl.bioforjarc.usuarios.dto.LoginRequest;
import cl.bioforjarc.usuarios.dto.LoginResponse;
import cl.bioforjarc.usuarios.dto.RegistroRequest;
import cl.bioforjarc.usuarios.dto.UsuarioActualizacionRequest;
import cl.bioforjarc.usuarios.dto.UsuarioResponse;
import cl.bioforjarc.usuarios.exception.ConflictoException;
import cl.bioforjarc.usuarios.exception.CredencialesInvalidasException;
import cl.bioforjarc.usuarios.exception.CuentaInactivaException;
import cl.bioforjarc.usuarios.exception.OperacionNoPermitidaException;
import cl.bioforjarc.usuarios.model.EstadoUsuario;
import cl.bioforjarc.usuarios.model.Rol;
import cl.bioforjarc.usuarios.model.Usuario;
import cl.bioforjarc.usuarios.repository.UsuarioRepository;
import cl.bioforjarc.usuarios.security.JwtService;
import cl.bioforjarc.usuarios.service.impl.UsuarioServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceImplTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private CorreoService correoService;

    private UsuarioServiceImpl servicio;

    @BeforeEach
    void preparar() {
        servicio = new UsuarioServiceImpl(usuarioRepository, passwordEncoder, jwtService, correoService);
    }

    @Test
    void registrarCreaClienteActivoConClaveHasheadaYCorreoNormalizado() {
        when(usuarioRepository.existsByCorreoIgnoreCase("nuevo@correo.cl")).thenReturn(false);
        when(passwordEncoder.encode("Clave1234")).thenReturn("hash-bcrypt");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocacion -> {
            Usuario guardado = invocacion.getArgument(0);
            guardado.setId(10L);
            return guardado;
        });

        RegistroRequest solicitud = new RegistroRequest(
                "  Ana ", "Pérez", "12.345.678-9", " Nuevo@Correo.CL ",
                "+56 9 1111 2222", "Clave1234");

        UsuarioResponse respuesta = servicio.registrar(solicitud);

        ArgumentCaptor<Usuario> captor = ArgumentCaptor.forClass(Usuario.class);
        verify(usuarioRepository).save(captor.capture());
        Usuario guardado = captor.getValue();

        assertEquals(10L, respuesta.id());
        assertEquals("Ana", guardado.getNombre());
        assertEquals("nuevo@correo.cl", guardado.getCorreo());
        assertEquals(Rol.CLIENTE, guardado.getRol());
        assertEquals(EstadoUsuario.ACTIVO, guardado.getEstado());
        assertNotEquals("Clave1234", guardado.getClaveHash());
        assertEquals("hash-bcrypt", guardado.getClaveHash());
        assertFalse(guardado.isCorreoConfirmado());
        assertNotNull(guardado.getTokenConfirmacion());
        assertNotNull(guardado.getFechaRegistro());
        verify(correoService).enviarConfirmacion(eq(guardado), eq(guardado.getTokenConfirmacion()));
    }

    @Test
    void registrarRechazaCorreoDuplicadoSinGuardar() {
        when(usuarioRepository.existsByCorreoIgnoreCase("ana@correo.cl")).thenReturn(true);

        RegistroRequest solicitud = new RegistroRequest(
                "Ana", "Pérez", "12.345.678-9", "ana@correo.cl", "", "Clave1234");

        assertThrows(ConflictoException.class, () -> servicio.registrar(solicitud));
        verify(usuarioRepository, never()).save(any(Usuario.class));
        verify(correoService, never()).enviarConfirmacion(any(), anyString());
    }

    @Test
    void loginCorrectoGeneraTokenYNoExponeClave() {
        Usuario usuario = usuario(1L, "ana@correo.cl", EstadoUsuario.ACTIVO);
        when(usuarioRepository.findByCorreoIgnoreCase("ana@correo.cl")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("Clave1234", "hash")).thenReturn(true);
        when(jwtService.generarToken(usuario)).thenReturn("jwt-de-prueba");
        when(jwtService.getExpiracionSegundos()).thenReturn(3600L);

        LoginResponse respuesta = servicio.login(new LoginRequest("ANA@correo.cl", "Clave1234"));

        assertEquals("jwt-de-prueba", respuesta.token());
        assertEquals("Bearer", respuesta.tipo());
        assertEquals(3600L, respuesta.expiraEn());
        assertEquals("ana@correo.cl", respuesta.usuario().correo());
    }

    @Test
    void loginRechazaClaveIncorrecta() {
        Usuario usuario = usuario(1L, "ana@correo.cl", EstadoUsuario.ACTIVO);
        when(usuarioRepository.findByCorreoIgnoreCase("ana@correo.cl")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("mala", "hash")).thenReturn(false);

        assertThrows(CredencialesInvalidasException.class,
                () -> servicio.login(new LoginRequest("ana@correo.cl", "mala")));
        verify(jwtService, never()).generarToken(any());
    }

    @Test
    void loginRechazaCuentaInactiva() {
        Usuario usuario = usuario(1L, "ana@correo.cl", EstadoUsuario.INACTIVO);
        when(usuarioRepository.findByCorreoIgnoreCase("ana@correo.cl")).thenReturn(Optional.of(usuario));
        when(passwordEncoder.matches("Clave1234", "hash")).thenReturn(true);

        assertThrows(CuentaInactivaException.class,
                () -> servicio.login(new LoginRequest("ana@correo.cl", "Clave1234")));
        verify(jwtService, never()).generarToken(any());
    }

    @Test
    void cambiarEstadoDesactivaLaCuenta() {
        Usuario usuario = usuario(2L, "ana@correo.cl", EstadoUsuario.ACTIVO);
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(usuario)).thenReturn(usuario);

        UsuarioResponse respuesta = servicio.cambiarEstado(2L,
                new EstadoRequest(EstadoUsuario.INACTIVO));

        assertEquals(EstadoUsuario.INACTIVO, respuesta.estado());
        assertEquals(EstadoUsuario.INACTIVO, usuario.getEstado());
    }

    @Test
    void clienteNoPuedeCambiarSuRol() {
        Usuario usuario = usuario(2L, "ana@correo.cl", EstadoUsuario.ACTIVO);
        when(usuarioRepository.findById(2L)).thenReturn(Optional.of(usuario));
        when(usuarioRepository.findByCorreoIgnoreCase("ana@correo.cl")).thenReturn(Optional.of(usuario));

        UsuarioActualizacionRequest solicitud = new UsuarioActualizacionRequest(
                "Ana", "Pérez", "12.345.678-9", "ana@correo.cl", "", Rol.ADMINISTRADOR);

        assertThrows(OperacionNoPermitidaException.class,
                () -> servicio.actualizar(2L, solicitud, false, "ana@correo.cl"));
        assertEquals(Rol.CLIENTE, usuario.getRol());
    }

    @Test
    void confirmarCorreoMarcaLaCuentaYConsumeElToken() {
        Usuario usuario = usuario(3L, "ana@correo.cl", EstadoUsuario.ACTIVO);
        usuario.setCorreoConfirmado(false);
        usuario.setTokenConfirmacion("token-123");
        when(usuarioRepository.findByTokenConfirmacion("token-123")).thenReturn(Optional.of(usuario));
        when(usuarioRepository.save(usuario)).thenReturn(usuario);

        var respuesta = servicio.confirmarCorreo("token-123");

        assertTrue(usuario.isCorreoConfirmado());
        assertEquals(null, usuario.getTokenConfirmacion());
        assertEquals("Correo confirmado correctamente", respuesta.mensaje());
    }

    private Usuario usuario(Long id, String correo, EstadoUsuario estado) {
        Usuario usuario = new Usuario();
        usuario.setId(id);
        usuario.setNombre("Ana");
        usuario.setApellido("Pérez");
        usuario.setRut("12.345.678-9");
        usuario.setCorreo(correo);
        usuario.setTelefono("+56 9 1111 2222");
        usuario.setClaveHash("hash");
        usuario.setRol(Rol.CLIENTE);
        usuario.setEstado(estado);
        usuario.setFechaRegistro(LocalDateTime.now());
        usuario.setDirecciones(List.of());
        return usuario;
    }
}
