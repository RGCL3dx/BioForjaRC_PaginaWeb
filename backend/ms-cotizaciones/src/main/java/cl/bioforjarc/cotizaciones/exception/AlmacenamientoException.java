package cl.bioforjarc.cotizaciones.exception;

/**
 * Falla tecnica al guardar o leer los archivos 3D en disco.
 */
public class AlmacenamientoException extends RuntimeException {

    public AlmacenamientoException(String mensaje, Throwable causa) {
        super(mensaje, causa);
    }
}
