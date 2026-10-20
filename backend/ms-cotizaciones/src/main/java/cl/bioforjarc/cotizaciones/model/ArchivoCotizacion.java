package cl.bioforjarc.cotizaciones.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * Archivo 3D (.STL/.OBJ) adjunto a una cotizacion (HU-04.1 y HU-04.2).
 * Solo se guarda la ruta relativa al directorio configurado; el binario vive
 * fuera del repositorio.
 */
@Entity
@Table(name = "archivos_cotizacion")
public class ArchivoCotizacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cotizacion_id", nullable = false)
    private Cotizacion cotizacion;

    @Column(name = "nombre_original", nullable = false, length = 255)
    private String nombreOriginal;

    @Column(nullable = false, length = 10)
    private String extension;

    @Column(name = "tipo_contenido", length = 120)
    private String tipoContenido;

    @Column(nullable = false)
    private long tamano;

    @Column(name = "ruta_almacenada", nullable = false, length = 400)
    private String rutaAlmacenada;

    @Column(name = "fecha_carga", nullable = false)
    private LocalDateTime fechaCarga;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Cotizacion getCotizacion() {
        return cotizacion;
    }

    public void setCotizacion(Cotizacion cotizacion) {
        this.cotizacion = cotizacion;
    }

    public String getNombreOriginal() {
        return nombreOriginal;
    }

    public void setNombreOriginal(String nombreOriginal) {
        this.nombreOriginal = nombreOriginal;
    }

    public String getExtension() {
        return extension;
    }

    public void setExtension(String extension) {
        this.extension = extension;
    }

    public String getTipoContenido() {
        return tipoContenido;
    }

    public void setTipoContenido(String tipoContenido) {
        this.tipoContenido = tipoContenido;
    }

    public long getTamano() {
        return tamano;
    }

    public void setTamano(long tamano) {
        this.tamano = tamano;
    }

    public String getRutaAlmacenada() {
        return rutaAlmacenada;
    }

    public void setRutaAlmacenada(String rutaAlmacenada) {
        this.rutaAlmacenada = rutaAlmacenada;
    }

    public LocalDateTime getFechaCarga() {
        return fechaCarga;
    }

    public void setFechaCarga(LocalDateTime fechaCarga) {
        this.fechaCarga = fechaCarga;
    }
}
