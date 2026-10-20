package cl.bioforjarc.cotizaciones.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Presupuesto que el administrador asigna a una cotizacion (HU-04.3).
 */
public class PresupuestoRequest {

    @NotNull(message = "El monto total es obligatorio")
    @DecimalMin(value = "0.0", inclusive = true, message = "El monto total no puede ser negativo")
    @Digits(integer = 10, fraction = 2, message = "El monto total admite como maximo 2 decimales")
    private BigDecimal montoTotal;

    @NotNull(message = "El plazo de entrega es obligatorio")
    @Min(value = 1, message = "El plazo de entrega debe ser al menos 1 dia")
    @Max(value = 365, message = "El plazo de entrega no puede superar 365 dias")
    private Integer plazoEntregaDias;

    @Size(max = 1000, message = "Las observaciones no pueden superar 1000 caracteres")
    private String observaciones;

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

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}
