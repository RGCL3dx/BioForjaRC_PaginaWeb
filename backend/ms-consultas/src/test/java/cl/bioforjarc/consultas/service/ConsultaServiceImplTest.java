package cl.bioforjarc.consultas.service;

import cl.bioforjarc.consultas.dto.ConsultaRequest;
import cl.bioforjarc.consultas.dto.ConsultaResponse;
import cl.bioforjarc.consultas.model.Consulta;
import cl.bioforjarc.consultas.repository.ConsultaRepository;
import cl.bioforjarc.consultas.service.impl.ConsultaServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ConsultaServiceImplTest {

    @Mock
    private ConsultaRepository consultaRepository;

    @Mock
    private CorreoService correoService;

    private ConsultaServiceImpl servicio;

    @BeforeEach
    void preparar() {
        servicio = new ConsultaServiceImpl(consultaRepository, correoService);
    }

    @Test
    void guardaYNotificaConsultaValida() {
        when(consultaRepository.saveAndFlush(any(Consulta.class))).thenAnswer(invocacion -> {
            Consulta consulta = invocacion.getArgument(0);
            consulta.setId(12L);
            consulta.setFechaEnvio(LocalDateTime.now());
            return consulta;
        });

        ConsultaResponse respuesta = servicio.enviar(solicitud(
                "  Ana Perez  ", "  ANA.PEREZ@Correo.CL ", "+56 9 1234 5678",
                "  Consulta por maceteros ", "  Quisiera saber si tienen maceteros grandes.  "));

        assertEquals(12L, respuesta.id());
        assertEquals("Ana Perez", respuesta.nombre());
        assertEquals("ana.perez@correo.cl", respuesta.correo());
        assertEquals("Consulta por maceteros", respuesta.asunto());
        assertNotNull(respuesta.fechaEnvio());
        assertTrue(respuesta.mensajeConfirmacion().contains("administrador"));

        ArgumentCaptor<Consulta> captor = ArgumentCaptor.forClass(Consulta.class);
        verify(consultaRepository).saveAndFlush(captor.capture());
        Consulta guardada = captor.getValue();
        assertEquals("Ana Perez", guardada.getNombre());
        assertEquals("ana.perez@correo.cl", guardada.getCorreo());
        assertEquals("+56 9 1234 5678", guardada.getTelefono());
        assertEquals("Quisiera saber si tienen maceteros grandes.", guardada.getMensaje());
        verify(correoService).notificarAdministrador(guardada);
    }

    @Test
    void telefonoVacioSeGuardaComoNulo() {
        when(consultaRepository.saveAndFlush(any(Consulta.class))).thenAnswer(invocacion -> {
            Consulta consulta = invocacion.getArgument(0);
            consulta.setId(13L);
            consulta.setFechaEnvio(LocalDateTime.now());
            return consulta;
        });

        servicio.enviar(solicitud("Ana Perez", "ana@correo.cl", "   ",
                "Consulta general", "Necesito informacion sobre despachos."));

        ArgumentCaptor<Consulta> captor = ArgumentCaptor.forClass(Consulta.class);
        verify(consultaRepository).saveAndFlush(captor.capture());
        assertNull(captor.getValue().getTelefono());
    }

    private ConsultaRequest solicitud(String nombre, String correo, String telefono,
                                      String asunto, String mensaje) {
        return new ConsultaRequest(nombre, correo, telefono, asunto, mensaje);
    }
}
