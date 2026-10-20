package cl.bioforjarc.pedidos.dto;

import cl.bioforjarc.pedidos.model.MetodoPago;
import cl.bioforjarc.pedidos.model.TipoDocumento;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Datos de checkout (HU-03.1). El correo del comprador se obtiene del JWT,
 * nunca del cuerpo, para impedir pedidos a nombre de otro usuario.
 *
 * <p>La direccion es obligatoria para envio a domicilio; en retiro presencial
 * puede omitirse. Esa regla se valida en el servicio porque depende del
 * metodo de despacho devuelto por ms-envios.</p>
 */
public record CrearPedidoRequest(

        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
        String nombre,

        @NotBlank(message = "El apellido es obligatorio")
        @Size(max = 100, message = "El apellido no puede superar 100 caracteres")
        String apellido,

        @Size(max = 30, message = "El telefono no puede superar 30 caracteres")
        String telefono,

        @Size(max = 20, message = "El RUT no puede superar 20 caracteres")
        String rut,

        @NotNull(message = "Debe elegir Boleta o Factura")
        TipoDocumento documentoTipo,

        @Size(max = 20, message = "El RUT de facturacion no puede superar 20 caracteres")
        String rutFacturacion,

        @Size(max = 150, message = "La razon social no puede superar 150 caracteres")
        String razonSocial,

        @Size(max = 120, message = "El giro no puede superar 120 caracteres")
        String giro,

        @Size(max = 200, message = "La direccion no puede superar 200 caracteres")
        String direccion,

        @Size(max = 120, message = "La comuna no puede superar 120 caracteres")
        String comuna,

        @Size(max = 40, message = "El codigo de region no puede superar 40 caracteres")
        String regionCodigo,

        @NotBlank(message = "El metodo de despacho es obligatorio")
        @Size(max = 30, message = "El metodo de despacho no puede superar 30 caracteres")
        String metodoDespacho,

        @NotNull(message = "Debe elegir un metodo de pago")
        MetodoPago metodoPago,

        @NotEmpty(message = "El pedido debe incluir al menos un producto")
        @Size(max = 50, message = "El pedido admite como maximo 50 productos distintos")
        List<@Valid ItemPedidoRequest> items
) {
}
