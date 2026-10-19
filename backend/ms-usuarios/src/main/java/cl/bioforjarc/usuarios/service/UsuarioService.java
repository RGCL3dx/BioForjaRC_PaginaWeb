package cl.bioforjarc.usuarios.service;

import cl.bioforjarc.usuarios.dto.EstadoRequest;
import cl.bioforjarc.usuarios.dto.LoginRequest;
import cl.bioforjarc.usuarios.dto.LoginResponse;
import cl.bioforjarc.usuarios.dto.MensajeResponse;
import cl.bioforjarc.usuarios.dto.RegistroRequest;
import cl.bioforjarc.usuarios.dto.UsuarioActualizacionRequest;
import cl.bioforjarc.usuarios.dto.UsuarioResponse;
import cl.bioforjarc.usuarios.dto.ValidacionUsuarioResponse;

import java.util.List;

public interface UsuarioService {

    UsuarioResponse registrar(RegistroRequest solicitud);

    LoginResponse login(LoginRequest solicitud);

    List<UsuarioResponse> listar(String busqueda);

    UsuarioResponse obtener(Long id, boolean esAdministrador, String correoAutenticado);

    ValidacionUsuarioResponse validarPorCorreo(String correo);

    UsuarioResponse actualizar(Long id, UsuarioActualizacionRequest solicitud,
                               boolean esAdministrador, String correoAutenticado);

    UsuarioResponse cambiarEstado(Long id, EstadoRequest solicitud);

    MensajeResponse confirmarCorreo(String token);
}
