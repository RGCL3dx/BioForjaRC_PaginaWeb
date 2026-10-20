package cl.bioforjarc.pedidos.service.impl;

import cl.bioforjarc.pedidos.model.DetallePedido;
import cl.bioforjarc.pedidos.model.Pedido;
import cl.bioforjarc.pedidos.model.TipoDocumento;
import cl.bioforjarc.pedidos.service.ComprobanteService;
import org.openpdf.text.Document;
import org.openpdf.text.DocumentException;
import org.openpdf.text.Element;
import org.openpdf.text.Font;
import org.openpdf.text.PageSize;
import org.openpdf.text.Paragraph;
import org.openpdf.text.Phrase;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;

@Service
public class ComprobanteServiceImpl implements ComprobanteService {

    @Override
    public byte[] generar(Pedido pedido) {
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        Document documento = new Document(PageSize.A4, 40, 40, 40, 40);
        try {
            PdfWriter.getInstance(documento, salida);
            documento.open();

            documento.add(PdfSoporte.centrado("BioForjaRC", PdfSoporte.fuente(20, Font.BOLD)));
            String titulo = pedido.getDocumentoTipo() == TipoDocumento.FACTURA
                    ? "Factura de compra" : "Boleta de compra";
            documento.add(PdfSoporte.centrado(titulo, PdfSoporte.fuente(14, Font.BOLD)));
            documento.add(PdfSoporte.centrado("Comprobante de pedido", PdfSoporte.fuente(9, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo(" ", PdfSoporte.fuente(6, Font.NORMAL)));

            documento.add(PdfSoporte.parrafo(
                    "Orden: " + pedido.getNumeroOrden(), PdfSoporte.fuente(11, Font.BOLD)));
            documento.add(PdfSoporte.parrafo(
                    "Fecha: " + PdfSoporte.fecha(pedido.getFechaCreacion()),
                    PdfSoporte.fuente(9, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo(
                    "Estado: " + pedido.getEstado().getEtiqueta(),
                    PdfSoporte.fuente(9, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo(" ", PdfSoporte.fuente(6, Font.NORMAL)));

            documento.add(PdfSoporte.parrafo("Cliente", PdfSoporte.fuente(10, Font.BOLD)));
            documento.add(PdfSoporte.parrafo(
                    pedido.getNombre() + " " + pedido.getApellido(),
                    PdfSoporte.fuente(9, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo(
                    "Correo: " + pedido.getCorreo(), PdfSoporte.fuente(9, Font.NORMAL)));
            if (pedido.getTelefono() != null) {
                documento.add(PdfSoporte.parrafo(
                        "Teléfono: " + pedido.getTelefono(), PdfSoporte.fuente(9, Font.NORMAL)));
            }
            if (pedido.getRut() != null) {
                documento.add(PdfSoporte.parrafo(
                        "RUT: " + pedido.getRut(), PdfSoporte.fuente(9, Font.NORMAL)));
            }

            if (pedido.getDocumentoTipo() == TipoDocumento.FACTURA) {
                documento.add(PdfSoporte.parrafo(" ", PdfSoporte.fuente(6, Font.NORMAL)));
                documento.add(PdfSoporte.parrafo("Datos de facturación", PdfSoporte.fuente(10, Font.BOLD)));
                documento.add(PdfSoporte.parrafo(
                        "RUT: " + texto(pedido.getRutFacturacion()), PdfSoporte.fuente(9, Font.NORMAL)));
                documento.add(PdfSoporte.parrafo(
                        "Razón social: " + texto(pedido.getRazonSocial()), PdfSoporte.fuente(9, Font.NORMAL)));
                if (pedido.getGiro() != null) {
                    documento.add(PdfSoporte.parrafo(
                            "Giro: " + pedido.getGiro(), PdfSoporte.fuente(9, Font.NORMAL)));
                }
            }

            documento.add(PdfSoporte.parrafo(" ", PdfSoporte.fuente(6, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo("Despacho", PdfSoporte.fuente(10, Font.BOLD)));
            documento.add(PdfSoporte.parrafo(
                    texto(pedido.getMetodoDespachoNombre()) + " · "
                            + texto(pedido.getRegionNombre()) + " · " + texto(pedido.getComuna()),
                    PdfSoporte.fuente(9, Font.NORMAL)));
            if (pedido.getDireccion() != null) {
                documento.add(PdfSoporte.parrafo(
                        "Dirección: " + pedido.getDireccion(), PdfSoporte.fuente(9, Font.NORMAL)));
            }
            documento.add(PdfSoporte.parrafo(
                    "Plazo estimado: " + pedido.getDiasHabiles() + " día(s) hábil(es)",
                    PdfSoporte.fuente(9, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo(" ", PdfSoporte.fuente(6, Font.NORMAL)));

            PdfPTable tabla = new PdfPTable(new float[]{5, 1.2f, 2, 2});
            tabla.setWidthPercentage(100);
            tabla.setHeaderRows(1);
            encabezado(tabla, "Producto");
            encabezado(tabla, "Cant.");
            encabezado(tabla, "Unitario");
            encabezado(tabla, "Subtotal");
            for (DetallePedido item : pedido.getItems()) {
                celda(tabla, item.getNombreProducto(), Element.ALIGN_LEFT);
                celda(tabla, String.valueOf(item.getCantidad()), Element.ALIGN_CENTER);
                celda(tabla, PdfSoporte.monto(item.getPrecioUnitario()), Element.ALIGN_RIGHT);
                celda(tabla, PdfSoporte.monto(item.getSubtotal()), Element.ALIGN_RIGHT);
            }
            documento.add(tabla);

            documento.add(PdfSoporte.parrafo(" ", PdfSoporte.fuente(6, Font.NORMAL)));
            documento.add(parrafoDerecha("Subtotal: " + PdfSoporte.monto(pedido.getSubtotal())));
            documento.add(parrafoDerecha("Envío: " + PdfSoporte.monto(pedido.getCostoEnvio())));
            documento.add(parrafoDerecha("Total: " + PdfSoporte.monto(pedido.getTotal()), true));
            documento.add(PdfSoporte.parrafo(" ", PdfSoporte.fuente(6, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo(
                    "Pago: " + pedido.getMetodoPago().getEtiqueta()
                            + " · " + pedido.getEstadoPago().getEtiqueta(),
                    PdfSoporte.fuente(9, Font.NORMAL)));
            if (pedido.getReferenciaPago() != null) {
                documento.add(PdfSoporte.parrafo(
                        "Referencia: " + pedido.getReferenciaPago(),
                        PdfSoporte.fuente(9, Font.NORMAL)));
            }
            documento.add(PdfSoporte.parrafo(" ", PdfSoporte.fuente(6, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo(
                    "Pago simulado con fines académicos. No se procesó un cargo real.",
                    PdfSoporte.fuente(8, Font.ITALIC)));
            documento.add(PdfSoporte.parrafo(
                    "Gracias por preferir BioForjaRC.", PdfSoporte.fuente(8, Font.NORMAL)));
        } catch (DocumentException ex) {
            throw new IllegalStateException("No fue posible generar el comprobante PDF", ex);
        } finally {
            if (documento.isOpen()) {
                documento.close();
            }
        }
        return salida.toByteArray();
    }

    private void encabezado(PdfPTable tabla, String texto) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, PdfSoporte.fuente(9, Font.BOLD)));
        celda.setHorizontalAlignment(Element.ALIGN_CENTER);
        celda.setPadding(5);
        tabla.addCell(celda);
    }

    private void celda(PdfPTable tabla, String texto, int alineacion) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, PdfSoporte.fuente(8, Font.NORMAL)));
        celda.setHorizontalAlignment(alineacion);
        celda.setPadding(4);
        tabla.addCell(celda);
    }

    private Paragraph parrafoDerecha(String texto) {
        return parrafoDerecha(texto, false);
    }

    private Paragraph parrafoDerecha(String texto, boolean destacado) {
        Paragraph parrafo = PdfSoporte.parrafo(texto,
                PdfSoporte.fuente(destacado ? 11 : 9, destacado ? Font.BOLD : Font.NORMAL));
        parrafo.setAlignment(Element.ALIGN_RIGHT);
        return parrafo;
    }

    private String texto(String valor) {
        return valor == null || valor.isBlank() ? "No informado" : valor;
    }
}
