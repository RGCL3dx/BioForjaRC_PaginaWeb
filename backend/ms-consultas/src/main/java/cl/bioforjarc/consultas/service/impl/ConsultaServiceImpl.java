package cl.bioforjarc.consultas.service.impl;

import cl.bioforjarc.consultas.dto.ConsultaRequest;
import cl.bioforjarc.consultas.dto.ConsultaResponse;
import cl.bioforjarc.consultas.model.Consulta;
import cl.bioforjarc.consultas.repository.ConsultaRepository;
import cl.bioforjarc.consultas.service.ConsultaService;
import cl.bioforjarc.consultas.service.CorreoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class ConsultaServiceImpl implements ConsultaService {

    private final ConsultaRepository consultaRepository;
    private final CorreoService correoService;

    public ConsultaServiceImpl(ConsultaRepository consultaRepository, CorreoService correoService) {
        this.consultaRepository = consultaRepository;
        this.correoService = correoService;
    }

    @Override
    @Transactional
    public ConsultaResponse enviar(ConsultaRequest solicitud) {
        Consulta consulta = new Consulta();
        consulta.setNombre(solicitud.nombre().trim());
        consulta.setCorreo(solicitud.correo().trim().toLowerCase(Locale.ROOT));
        consulta.setTelefono(textoOpcional(solicitud.telefono()));
        consulta.setAsunto(solicitud.asunto().trim());
        consulta.setMensaje(solicitud.mensaje().trim());

        Consulta guardada = consultaRepository.saveAndFlush(consulta);

        // HU-05.1: el administrador recibe el aviso despues de guardar la consulta.
        correoService.notificarAdministrador(guardada);

        return new ConsultaResponse(
                guardada.getId(),
                guardada.getNombre(),
                guardada.getCorreo(),
                guardada.getAsunto(),
                guardada.getFechaEnvio(),
                "Consulta enviada. El administrador fue notificado por correo.");
    }

    private String textoOpcional(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}
