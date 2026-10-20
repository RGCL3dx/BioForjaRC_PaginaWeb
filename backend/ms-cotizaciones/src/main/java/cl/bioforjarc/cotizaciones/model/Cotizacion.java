package cl.bioforjarc.cotizaciones.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Ticket de cotizacion personalizada (HU-04.1) y su presupuesto (HU-04.3).
 * Guarda una copia de los datos enviados para que el detalle no cambie.
 */
@Entity
@Table(name = "cotizaciones",
        uniqueConstraints = @UniqueConstraint(name = "uk_cotizaciones_numero_ticket", columnNames = "numero_ticket"),
        indexes = {
                @Index(name = "idx_cotizaciones_correo", columnList = "correo"),
                @Index(name = "idx_cotizaciones_fecha", columnList = "fecha_creacion"),
                @Index(name = "idx_cotizaciones_estado", columnList = "estado")
        })
public class Cotizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_ticket", nullable = false, length = 30)
    private String numeroTicket;

    @Column(nullable = false, length = 80)
    private String nombre;

    @Column(nullable = false, length = 80)
    private String apellido;

    @Column(nullable = false, length = 150)
    private String correo;

    @Column(length = 30)
    private String telefono;

    @Column(nullable = false, length = 60)
    private String categoria;

    private Integer cantidad;

    @Column(length = 30)
    private String plazo;

    @Column(nullable = false, length = 2000)
    private String descripcion;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoCotizacion estado;

    @Column(name = "monto_total", precision = 12, scale = 2)
    private BigDecimal montoTotal;

    @Column(name = "plazo_entrega_dias")
    private Integer plazoEntregaDias;

    @Column(name = "observaciones_presupuesto", length = 1000)
    private String observacionesPresupuesto;

    @Column(name = "enlace_pago", length = 300)
    private String enlacePago;

    @Column(name = "fecha_presupuesto")
    private LocalDateTime fechaPresupuesto;

    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @OneToMany(mappedBy = "cotizacion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ArchivoCotizacion> archivos = new ArrayList<>();

    @PrePersist
    void antesDeGuardar() {
        LocalDateTime ahora = LocalDateTime.now();
        if (fechaCreacion == null) {
            fechaCreacion = ahora;
        }
        fechaActualizacion = ahora;
    }

    @PreUpdate
    void antesDeActualizar() {
        fechaActualizacion = LocalDateTime.now();
    }

    public void agregarArchivo(ArchivoCotizacion archivo) {
        archivo.setCotizacion(this);
        archivos.add(archivo);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNumeroTicket() {
        return numeroTicket;
    }

    public void setNumeroTicket(String numeroTicket) {
        this.numeroTicket = numeroTicket;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellido() {
        return apellido;
    }

    public void setApellido(String apellido) {
        this.apellido = apellido;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public String getPlazo() {
        return plazo;
    }

    public void setPlazo(String plazo) {
        this.plazo = plazo;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public EstadoCotizacion getEstado() {
        return estado;
    }

    public void setEstado(EstadoCotizacion estado) {
        this.estado = estado;
    }

    public BigDecimal getMontoTotal() {
        return montoTotal;
    }

    public void setMontoTotal(BigDecimal montoTotal) {
        this.montoTotal = montoTotal;
    }

    public Integer getPlazoEntregaDias() {
        return plazoEntregaDias;
    }

    public void setPlazoEntregaDias(Integer plazoEntregaDias) {
        this.plazoEntregaDias = plazoEntregaDias;
    }

    public String getObservacionesPresupuesto() {
        return observacionesPresupuesto;
    }

    public void setObservacionesPresupuesto(String observacionesPresupuesto) {
        this.observacionesPresupuesto = observacionesPresupuesto;
    }

    public String getEnlacePago() {
        return enlacePago;
    }

    public void setEnlacePago(String enlacePago) {
        this.enlacePago = enlacePago;
    }

    public LocalDateTime getFechaPresupuesto() {
        return fechaPresupuesto;
    }

    public void setFechaPresupuesto(LocalDateTime fechaPresupuesto) {
        this.fechaPresupuesto = fechaPresupuesto;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }

    public List<ArchivoCotizacion> getArchivos() {
        return archivos;
    }

    public void setArchivos(List<ArchivoCotizacion> archivos) {
        this.archivos = archivos;
    }
}
