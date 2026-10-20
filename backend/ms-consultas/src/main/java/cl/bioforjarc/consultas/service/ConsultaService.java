package cl.bioforjarc.consultas.service;

import cl.bioforjarc.consultas.dto.ConsultaRequest;
import cl.bioforjarc.consultas.dto.ConsultaResponse;

public interface ConsultaService {

    ConsultaResponse enviar(ConsultaRequest solicitud);
}
