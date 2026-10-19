package cl.bioforjarc.usuarios.service;

import cl.bioforjarc.usuarios.dto.DireccionRequest;
import cl.bioforjarc.usuarios.dto.DireccionResponse;

import java.util.List;

public interface DireccionService {

    List<DireccionResponse> listar(Long usuarioId, boolean esAdministrador, String correoAutenticado);

    DireccionResponse crear(Long usuarioId, DireccionRequest solicitud,
                            boolean esAdministrador, String correoAutenticado);

    DireccionResponse actualizar(Long usuarioId, Long direccionId, DireccionRequest solicitud,
                                 boolean esAdministrador, String correoAutenticado);

    void eliminar(Long usuarioId, Long direccionId, boolean esAdministrador, String correoAutenticado);

    DireccionResponse marcarPrincipal(Long usuarioId, Long direccionId,
                                      boolean esAdministrador, String correoAutenticado);
}
