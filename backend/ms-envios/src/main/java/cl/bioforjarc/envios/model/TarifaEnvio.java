package cl.bioforjarc.envios.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;

/**
 * Tarifa de envío. Si {@code comuna} es nula, la tarifa aplica a toda la
 * región; si tiene comuna, es una excepción para esa comuna (por ejemplo,
 * Isla de Pascua o Puerto Williams).
 */
@Entity
@Table(name = "tarifas_envio", uniqueConstraints = {
        @UniqueConstraint(name = "uk_tarifas_envio_codigo", columnNames = "codigo")
})
public class TarifaEnvio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String codigo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "region_id", nullable = false)
    private Region region;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comuna_id")
    private Comuna comuna;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "metodo_id", nullable = false)
    private MetodoDespacho metodo;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal costo;

    @Column(name = "dias_habiles", nullable = false)
    private int diasHabiles;

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

    public Region getRegion() {
        return region;
    }

    public void setRegion(Region region) {
        this.region = region;
    }

    public Comuna getComuna() {
        return comuna;
    }

    public void setComuna(Comuna comuna) {
        this.comuna = comuna;
    }

    public MetodoDespacho getMetodo() {
        return metodo;
    }

    public void setMetodo(MetodoDespacho metodo) {
        this.metodo = metodo;
    }

    public BigDecimal getCosto() {
        return costo;
    }

    public void setCosto(BigDecimal costo) {
        this.costo = costo;
    }

    public int getDiasHabiles() {
        return diasHabiles;
    }

    public void setDiasHabiles(int diasHabiles) {
        this.diasHabiles = diasHabiles;
    }
}
