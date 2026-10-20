package cl.bioforjarc.catalogo.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Respuesta de paginación propia para no acoplar el contrato HTTP a los
 * nombres internos de Spring Data.
 */
public record PaginaResponse<T>(
        List<T> contenido,
        int pagina,
        int tamano,
        long totalElementos,
        int totalPaginas,
        boolean primera,
        boolean ultima
) {

    public static <T> PaginaResponse<T> desde(Page<T> page) {
        return new PaginaResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast());
    }
}
