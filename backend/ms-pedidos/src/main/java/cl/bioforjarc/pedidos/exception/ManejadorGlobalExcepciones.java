package cl.bioforjarc.pedidos.exception;

import cl.bioforjarc.pedidos.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ManejadorGlobalExcepciones {

    private static final Logger log = LoggerFactory.getLogger(ManejadorGlobalExcepciones.class);

    @ExceptionHandler(RecursoNoEncontradoException.class)
    public ResponseEntity<ErrorResponse> noEncontrado(RecursoNoEncontradoException ex,
                                                      HttpServletRequest req) {
        return responder(HttpStatus.NOT_FOUND, ex.getMessage(), req);
    }

    @ExceptionHandler(SolicitudInvalidaException.class)
    public ResponseEntity<ErrorResponse> solicitudInvalida(SolicitudInvalidaException ex,
                                                           HttpServletRequest req) {
        return responder(HttpStatus.BAD_REQUEST, ex.getMessage(), req);
    }

    @ExceptionHandler(OperacionNoPermitidaException.class)
    public ResponseEntity<ErrorResponse> noPermitida(OperacionNoPermitidaException ex,
                                                     HttpServletRequest req) {
        return responder(HttpStatus.FORBIDDEN, ex.getMessage(), req);
    }

    @ExceptionHandler(ServicioNoDisponibleException.class)
    public ResponseEntity<ErrorResponse> servicioNoDisponible(ServicioNoDisponibleException ex,
                                                              HttpServletRequest req) {
        return responder(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), req);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> validacion(MethodArgumentNotValidException ex,
                                                    HttpServletRequest req) {
        Map<String, String> detalles = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
                detalles.putIfAbsent(error.getField(), error.getDefaultMessage()));
        ErrorResponse cuerpo = ErrorResponse.deValidacion(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                "Los datos enviados no son válidos",
                req.getRequestURI(),
                detalles);
        return ResponseEntity.badRequest().body(cuerpo);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> restricciones(ConstraintViolationException ex,
                                                       HttpServletRequest req) {
        Map<String, String> detalles = new LinkedHashMap<>();
        ex.getConstraintViolations().forEach(violacion ->
                detalles.put(violacion.getPropertyPath().toString(), violacion.getMessage()));
        ErrorResponse cuerpo = ErrorResponse.deValidacion(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                "Los parámetros enviados no son válidos",
                req.getRequestURI(),
                detalles);
        return ResponseEntity.badRequest().body(cuerpo);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class, IllegalArgumentException.class})
    public ResponseEntity<ErrorResponse> cuerpoInvalido(Exception ex, HttpServletRequest req) {
        return responder(HttpStatus.BAD_REQUEST,
                "El cuerpo o los parámetros de la solicitud no son válidos", req);
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> parametrosInvalidos(HandlerMethodValidationException ex,
                                                             HttpServletRequest req) {
        Map<String, String> detalles = new LinkedHashMap<>();
        ex.getParameterValidationResults().forEach(resultado ->
                resultado.getResolvableErrors().forEach(error ->
                        detalles.putIfAbsent(resultado.getMethodParameter().getParameterName(),
                                error.getDefaultMessage())));
        ErrorResponse cuerpo = ErrorResponse.deValidacion(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                "Los parámetros enviados no son válidos",
                req.getRequestURI(),
                detalles);
        return ResponseEntity.badRequest().body(cuerpo);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> integridad(DataIntegrityViolationException ex,
                                                    HttpServletRequest req) {
        log.warn("Violación de integridad en {}: {}", req.getRequestURI(),
                ex.getMostSpecificCause().getMessage());
        return responder(HttpStatus.CONFLICT, "Ya existe un registro con esos datos", req);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> rutaNoEncontrada(NoResourceFoundException ex,
                                                          HttpServletRequest req) {
        return responder(HttpStatus.NOT_FOUND, "La ruta solicitada no existe", req);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> errorInterno(Exception ex, HttpServletRequest req) {
        log.error("Error no controlado en {}", req.getRequestURI(), ex);
        return responder(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error interno", req);
    }

    private ResponseEntity<ErrorResponse> responder(HttpStatus estado, String mensaje,
                                                    HttpServletRequest req) {
        ErrorResponse cuerpo = ErrorResponse.de(
                estado.value(),
                estado.getReasonPhrase(),
                mensaje,
                req.getRequestURI());
        return ResponseEntity.status(estado).body(cuerpo);
    }
}
