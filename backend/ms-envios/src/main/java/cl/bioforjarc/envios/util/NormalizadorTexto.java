package cl.bioforjarc.envios.util;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Normaliza textos para comparar comunas y construir slugs estables.
 */
public final class NormalizadorTexto {

    private NormalizadorTexto() {
    }

    public static String aSlug(String valor) {
        if (valor == null) {
            return "";
        }
        String plano = Normalizer.normalize(valor, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return plano;
    }

    public static String limpiar(String valor) {
        if (valor == null || valor.isBlank()) {
            return null;
        }
        return valor.trim();
    }
}
