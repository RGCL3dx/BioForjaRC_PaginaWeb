package cl.bioforjarc.usuarios.service.impl;

import cl.bioforjarc.usuarios.dto.DireccionRequest;
import cl.bioforjarc.usuarios.dto.DireccionResponse;
import cl.bioforjarc.usuarios.exception.OperacionNoPermitidaException;
import cl.bioforjarc.usuarios.exception.RecursoNoEncontradoException;
import cl.bioforjarc.usuarios.model.Direccion;
import cl.bioforjarc.usuarios.model.Usuario;
import cl.bioforjarc.usuarios.repository.DireccionRepository;
import cl.bioforjarc.usuarios.repository.UsuarioRepository;
import cl.bioforjarc.usuarios.service.DireccionService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class DireccionServiceImpl implements DireccionService {

    private final UsuarioRepository usuarioRepository;
    private final DireccionRepository direccionRepository;

    public DireccionServiceImpl(UsuarioRepository usuarioRepository,
                                DireccionRepository direccionRepository) {
        this.usuarioRepository = usuarioRepository;
        this.direccionRepository = direccionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<DireccionResponse> listar(Long usuarioId, boolean esAdministrador, String correoAutenticado) {
        Usuario usuario = verificarAcceso(usuarioId, esAdministrador, correoAutenticado);
        return direccionRepository.findByUsuarioIdOrderByPrincipalDescIdAsc(usuario.getId())
                .stream().map(DireccionResponse::desde).toList();
    }

    @Override
    public DireccionResponse crear(Long usuarioId, DireccionRequest solicitud,
                                   boolean esAdministrador, String correoAutenticado) {
        Usuario usuario = verificarAcceso(usuarioId, esAdministrador, correoAutenticado);
        boolean primera = direccionRepository.countByUsuarioId(usuarioId) == 0;
        boolean principal = solicitud.principal() || primera;

        if (principal) {
            desmarcarPrincipales(usuarioId, null);
        }

        Direccion direccion = new Direccion();
        copiarDatos(direccion, solicitud);
        direccion.setPrincipal(principal);
        direccion.setUsuario(usuario);

        Direccion guardada = direccionRepository.save(direccion);
        return DireccionResponse.desde(guardada);
    }

    @Override
    public DireccionResponse actualizar(Long usuarioId, Long direccionId, DireccionRequest solicitud,
                                        boolean esAdministrador, String correoAutenticado) {
        verificarAcceso(usuarioId, esAdministrador, correoAutenticado);
        Direccion direccion = buscarDireccion(usuarioId, direccionId);

        boolean eraPrincipal = direccion.isPrincipal();
        long total = direccionRepository.countByUsuarioId(usuarioId);
        boolean principal = solicitud.principal() || (eraPrincipal && total == 1);

        if (principal) {
            desmarcarPrincipales(usuarioId, direccionId);
        }

        copiarDatos(direccion, solicitud);
        direccion.setPrincipal(principal);
        return DireccionResponse.desde(direccionRepository.save(direccion));
    }

    @Override
    public void eliminar(Long usuarioId, Long direccionId, boolean esAdministrador, String correoAutenticado) {
        verificarAcceso(usuarioId, esAdministrador, correoAutenticado);
        Direccion direccion = buscarDireccion(usuarioId, direccionId);
        boolean eraPrincipal = direccion.isPrincipal();

        direccionRepository.delete(direccion);
        direccionRepository.flush();

        if (eraPrincipal) {
            List<Direccion> restantes = direccionRepository.findByUsuarioIdOrderByPrincipalDescIdAsc(usuarioId);
            if (!restantes.isEmpty()) {
                Direccion nuevaPrincipal = restantes.getFirst();
                nuevaPrincipal.setPrincipal(true);
                direccionRepository.save(nuevaPrincipal);
            }
        }
    }

    @Override
    public DireccionResponse marcarPrincipal(Long usuarioId, Long direccionId,
                                             boolean esAdministrador, String correoAutenticado) {
        verificarAcceso(usuarioId, esAdministrador, correoAutenticado);
        Direccion direccion = buscarDireccion(usuarioId, direccionId);
        desmarcarPrincipales(usuarioId, direccionId);
        direccion.setPrincipal(true);
        return DireccionResponse.desde(direccionRepository.save(direccion));
    }

    private Usuario verificarAcceso(Long usuarioId, boolean esAdministrador, String correoAutenticado) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNoEncontradoException("No existe un usuario con id " + usuarioId));

        if (!esAdministrador && (correoAutenticado == null
                || !usuario.getCorreo().equalsIgnoreCase(correoAutenticado.trim()))) {
            throw new OperacionNoPermitidaException("Solo puede administrar sus propias direcciones");
        }
        return usuario;
    }

    private Direccion buscarDireccion(Long usuarioId, Long direccionId) {
        return direccionRepository.findByIdAndUsuarioId(direccionId, usuarioId)
                .orElseThrow(() -> new RecursoNoEncontradoException(
                        "No existe la dirección " + direccionId + " para el usuario " + usuarioId));
    }

    private void desmarcarPrincipales(Long usuarioId, Long exceptoId) {
        List<Direccion> direcciones = direccionRepository.findByUsuarioIdOrderByPrincipalDescIdAsc(usuarioId);
        for (Direccion otra : direcciones) {
            if (otra.isPrincipal() && (exceptoId == null || !otra.getId().equals(exceptoId))) {
                otra.setPrincipal(false);
                direccionRepository.save(otra);
            }
        }
    }

    private void copiarDatos(Direccion direccion, DireccionRequest solicitud) {
        direccion.setRegion(solicitud.region().trim());
        direccion.setComuna(solicitud.comuna().trim());
        direccion.setCalle(solicitud.calle().trim());
        direccion.setNumero(solicitud.numero().trim());
        direccion.setDepartamento(limpiarONulo(solicitud.departamento()));
        direccion.setReferencia(limpiarONulo(solicitud.referencia()));
    }

    private String limpiarONulo(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}
