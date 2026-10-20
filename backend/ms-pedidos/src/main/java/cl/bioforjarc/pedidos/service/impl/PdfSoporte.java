package cl.bioforjarc.pedidos.service.impl;

import org.openpdf.text.DocumentException;
import org.openpdf.text.Element;
import org.openpdf.text.Font;
import org.openpdf.text.Paragraph;
import org.openpdf.text.pdf.BaseFont;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Utilidades compartidas para los PDF de comprobante y reportes.
 */
final class PdfSoporte {

    private static final BaseFont BASE = crearBase();
    private static final DateTimeFormatter FECHA =
            DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm");

    private PdfSoporte() {
    }

    static Font fuente(float tamano, int estilo) {
        return new Font(BASE, tamano, estilo, java.awt.Color.BLACK);
    }

    static Paragraph parrafo(String texto, Font fuente) {
        Paragraph parrafo = new Paragraph(texto, fuente);
        parrafo.setLeading(fuente.getSize() + 4f);
        return parrafo;
    }

    static Paragraph centrado(String texto, Font fuente) {
        Paragraph parrafo = parrafo(texto, fuente);
        parrafo.setAlignment(Element.ALIGN_CENTER);
        return parrafo;
    }

    static String monto(BigDecimal valor) {
        BigDecimal seguro = valor == null ? BigDecimal.ZERO : valor;
        DecimalFormatSymbols simbolos = DecimalFormatSymbols.getInstance(
                Locale.forLanguageTag("es-CL"));
        DecimalFormat formato = new DecimalFormat("#,##0", simbolos);
        return "$" + formato.format(seguro);
    }

    static String fecha(LocalDateTime valor) {
        return valor == null ? "" : valor.format(FECHA);
    }

    private static BaseFont crearBase() {
        try {
            return BaseFont.createFont(BaseFont.HELVETICA, BaseFont.WINANSI, BaseFont.NOT_EMBEDDED);
        } catch (DocumentException | java.io.IOException ex) {
            throw new IllegalStateException("No fue posible preparar la fuente del PDF", ex);
        }
    }
}
