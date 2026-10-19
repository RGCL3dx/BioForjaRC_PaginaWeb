package cl.bioforjarc.usuarios.config;

import cl.bioforjarc.usuarios.model.Direccion;
import cl.bioforjarc.usuarios.model.EstadoUsuario;
import cl.bioforjarc.usuarios.model.Rol;
import cl.bioforjarc.usuarios.model.Usuario;
import cl.bioforjarc.usuarios.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Datos semilla definidos en el README del proyecto.
 * Solo crea las cuentas si no existen; nunca sobrescribe contraseñas cambiadas.
 */
@Component
@ConditionalOnProperty(prefix = "bioforja.semilla", name = "habilitada",
        havingValue = "true", matchIfMissing = true)
public class DatosSemilla implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatosSemilla.class);

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public DatosSemilla(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        crearAdministrador();
        crearCliente();
    }

    private void crearAdministrador() {
        if (usuarioRepository.existsByCorreoIgnoreCase("admin@bioforjarc.cl")) {
            return;
        }
        Usuario admin = new Usuario();
        admin.setNombre("Administrador");
        admin.setApellido("");
        admin.setRut("11.111.111-1");
        admin.setCorreo("admin@bioforjarc.cl");
        admin.setTelefono("+56 9 0000 0000");
        admin.setClaveHash(passwordEncoder.encode("Admin123"));
        admin.setRol(Rol.ADMINISTRADOR);
        admin.setEstado(EstadoUsuario.ACTIVO);
        admin.setFechaRegistro(LocalDateTime.now());
        admin.setCorreoConfirmado(true);
        usuarioRepository.save(admin);
        log.info("Cuenta semilla de administrador creada: admin@bioforjarc.cl");
    }

    private void crearCliente() {
        var existente = usuarioRepository.findByCorreoIgnoreCase("hermenegildo.gonzalez@correo.cl");
        if (existente.isPresent()) {
            return;
        }
        Usuario cliente = new Usuario();
        cliente.setNombre("Hermenegildo");
        cliente.setApellido("González");
        cliente.setRut("12.345.678-9");
        cliente.setCorreo("hermenegildo.gonzalez@correo.cl");
        cliente.setTelefono("+56 9 1234 5678");
        cliente.setClaveHash(passwordEncoder.encode("Clave1234"));
        cliente.setRol(Rol.CLIENTE);
        cliente.setEstado(EstadoUsuario.ACTIVO);
        cliente.setFechaRegistro(LocalDateTime.now());
        cliente.setCorreoConfirmado(true);

        Direccion direccion = new Direccion();
        direccion.setRegion("Región Metropolitana");
        direccion.setComuna("Santiago Centro");
        direccion.setCalle("Av. Siempre Viva");
        direccion.setNumero("123");
        direccion.setReferencia("Casa con reja verde");
        direccion.setPrincipal(true);
        cliente.agregarDireccion(direccion);

        usuarioRepository.save(cliente);
        log.info("Cuenta semilla de cliente creada: hermenegildo.gonzalez@correo.cl");
    }
}
