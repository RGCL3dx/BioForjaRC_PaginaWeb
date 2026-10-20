package cl.bioforjarc.envios.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;

/**
 * Método de despacho disponible en el checkout (HU-06.2):
 * envío estándar, envío express o retiro presencial.
 *
 * <p>Los métodos con {@code requiereDireccion = true} obtienen su costo desde
 * una {@link TarifaEnvio} según la región o comuna. El retiro presencial usa
 * {@code costoFijo} y no necesita dirección.</p>
 */
@Entity
@Table(name = "metodos_despacho", uniqueConstraints = {
        @UniqueConstraint(name = "uk_metodos_despacho_codigo", columnNames = "codigo")
})
public class MetodoDespacho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String codigo;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(length = 250)
    private String descripcion;

    @Column(name = "requiere_direccion", nullable = false)
    private boolean requiereDireccion;

    @Column(name = "costo_fijo", precision = 12, scale = 2)
    private BigDecimal costoFijo;

    @Column(name = "dias_habiles", nullable = false)
    private int diasHabiles;

    @Column(nullable = false)
    private boolean activo;

    @Column(nullable = false)
    private int orden;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigo() {
        return codigo;
    }

    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public boolean isRequiereDireccion() {
        return requiereDireccion;
    }

    public void setRequiereDireccion(boolean requiereDireccion) {
        this.requiereDireccion = requiereDireccion;
    }

    public BigDecimal getCostoFijo() {
        return costoFijo;
    }

    public void setCostoFijo(BigDecimal costoFijo) {
        this.costoFijo = costoFijo;
    }

    public int getDiasHabiles() {
        return diasHabiles;
    }

    public void setDiasHabiles(int diasHabiles) {
        this.diasHabiles = diasHabiles;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public int getOrden() {
        return orden;
    }

    public void setOrden(int orden) {
        this.orden = orden;
    }
}
