package cl.bioforjarc.catalogo.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

public final class AccesoUtils {

    public static final String ROL_ADMINISTRADOR = "ROLE_ADMINISTRADOR";

    private AccesoUtils() {
    }

    public static boolean esAdministrador(Authentication autenticacion) {
        if (autenticacion == null || !autenticacion.isAuthenticated()) {
            return false;
        }
        return autenticacion.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(ROL_ADMINISTRADOR::equals);
    }
}
