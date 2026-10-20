package cl.bioforjarc.pedidos.service.impl;

import cl.bioforjarc.pedidos.dto.IngresoPeriodoResponse;
import cl.bioforjarc.pedidos.dto.ProductoVendidoResponse;
import cl.bioforjarc.pedidos.dto.ReporteVentasResponse;
import cl.bioforjarc.pedidos.service.ReporteExportService;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.openpdf.text.Document;
import org.openpdf.text.DocumentException;
import org.openpdf.text.Element;
import org.openpdf.text.Font;
import org.openpdf.text.PageSize;
import org.openpdf.text.Phrase;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@Service
public class ReporteExportServiceImpl implements ReporteExportService {

    @Override
    public byte[] excel(ReporteVentasResponse reporte) {
        try (XSSFWorkbook libro = new XSSFWorkbook();
             ByteArrayOutputStream salida = new ByteArrayOutputStream()) {

            CellStyle negrita = libro.createCellStyle();
            org.apache.poi.ss.usermodel.Font fuenteNegrita = libro.createFont();
            fuenteNegrita.setBold(true);
            negrita.setFont(fuenteNegrita);

            CellStyle moneda = libro.createCellStyle();
            moneda.setDataFormat(libro.createDataFormat().getFormat("$#,##0"));

            Sheet resumen = libro.createSheet("Resumen");
            fila(resumen, 0, "Reporte de ventas BioForjaRC");
            fila(resumen, 1, "Desde", reporte.desde());
            fila(resumen, 2, "Hasta", reporte.hasta());
            filaMoneda(resumen, 3, "Total ventas", reporte.totalVentas(), moneda);
            filaMoneda(resumen, 4, "Ticket promedio", reporte.ticketPromedio(), moneda);
            fila(resumen, 5, "Cantidad de pedidos", reporte.cantidadPedidos());
            fila(resumen, 6, "Unidades vendidas", reporte.unidadesVendidas());
            resumen.getRow(0).getCell(0).setCellStyle(negrita);
            for (int i = 0; i < 2; i++) {
                resumen.autoSizeColumn(i);
            }

            Sheet diarios = libro.createSheet("Ingresos diarios");
            filaEncabezado(diarios, negrita, "Periodo", "Pedidos", "Monto");
            escribirIngresos(diarios, reporte.ingresosPorDia(), moneda);
            ajustarColumnas(diarios, 3);

            Sheet mensuales = libro.createSheet("Ingresos mensuales");
            filaEncabezado(mensuales, negrita, "Periodo", "Pedidos", "Monto");
            escribirIngresos(mensuales, reporte.ingresosPorMes(), moneda);
            ajustarColumnas(mensuales, 3);

            Sheet productos = libro.createSheet("Top 5 productos");
            filaEncabezado(productos, negrita, "Producto ID", "Producto", "Unidades", "Ingresos");
            int fila = 1;
            for (ProductoVendidoResponse producto : reporte.topProductos()) {
                Row actual = productos.createRow(fila++);
                actual.createCell(0).setCellValue(producto.productoId());
                actual.createCell(1).setCellValue(producto.nombre());
                actual.createCell(2).setCellValue(producto.unidades());
                Cell ingresos = actual.createCell(3);
                ingresos.setCellValue(valor(producto.ingresos()));
                ingresos.setCellStyle(moneda);
            }
            ajustarColumnas(productos, 4);

            libro.write(salida);
            return salida.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("No fue posible generar el reporte Excel", ex);
        }
    }

    @Override
    public byte[] pdf(ReporteVentasResponse reporte) {
        ByteArrayOutputStream salida = new ByteArrayOutputStream();
        Document documento = new Document(PageSize.A4, 36, 36, 36, 36);
        try {
            PdfWriter.getInstance(documento, salida);
            documento.open();

            documento.add(PdfSoporte.centrado("BioForjaRC", PdfSoporte.fuente(20, Font.BOLD)));
            documento.add(PdfSoporte.centrado("Reporte de ventas y rendimiento",
                    PdfSoporte.fuente(13, Font.BOLD)));
            documento.add(PdfSoporte.centrado(
                    "Periodo: " + reporte.desde() + " al " + reporte.hasta(),
                    PdfSoporte.fuente(9, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo(" ", PdfSoporte.fuente(6, Font.NORMAL)));

            documento.add(PdfSoporte.parrafo(
                    "Total ventas: " + PdfSoporte.monto(reporte.totalVentas()),
                    PdfSoporte.fuente(11, Font.BOLD)));
            documento.add(PdfSoporte.parrafo(
                    "Ticket promedio: " + PdfSoporte.monto(reporte.ticketPromedio()),
                    PdfSoporte.fuente(9, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo(
                    "Pedidos: " + reporte.cantidadPedidos()
                            + " · Unidades vendidas: " + reporte.unidadesVendidas(),
                    PdfSoporte.fuente(9, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo(" ", PdfSoporte.fuente(6, Font.NORMAL)));

            documento.add(PdfSoporte.parrafo("Ingresos diarios", PdfSoporte.fuente(11, Font.BOLD)));
            documento.add(tablaIngresos(reporte.ingresosPorDia()));

            documento.add(PdfSoporte.parrafo(" ", PdfSoporte.fuente(6, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo("Ingresos mensuales", PdfSoporte.fuente(11, Font.BOLD)));
            documento.add(tablaIngresos(reporte.ingresosPorMes()));

            documento.add(PdfSoporte.parrafo(" ", PdfSoporte.fuente(6, Font.NORMAL)));
            documento.add(PdfSoporte.parrafo("Top 5 productos más vendidos",
                    PdfSoporte.fuente(11, Font.BOLD)));
            documento.add(tablaProductos(reporte.topProductos()));
        } catch (DocumentException ex) {
            throw new IllegalStateException("No fue posible generar el reporte PDF", ex);
        } finally {
            if (documento.isOpen()) {
                documento.close();
            }
        }
        return salida.toByteArray();
    }

    @Override
    public String nombreArchivo(ReporteVentasResponse reporte, String extension) {
        return "reporte-ventas-" + reporte.desde() + "-a-" + reporte.hasta() + "." + extension;
    }

    private void escribirIngresos(Sheet hoja, List<IngresoPeriodoResponse> ingresos, CellStyle moneda) {
        int fila = 1;
        for (IngresoPeriodoResponse ingreso : ingresos) {
            Row actual = hoja.createRow(fila++);
            actual.createCell(0).setCellValue(ingreso.periodo());
            actual.createCell(1).setCellValue(ingreso.pedidos());
            Cell monto = actual.createCell(2);
            monto.setCellValue(valor(ingreso.monto()));
            monto.setCellStyle(moneda);
        }
    }

    private void filaEncabezado(Sheet hoja, CellStyle estilo, String... valores) {
        Row fila = hoja.createRow(0);
        for (int i = 0; i < valores.length; i++) {
            Cell celda = fila.createCell(i);
            celda.setCellValue(valores[i]);
            celda.setCellStyle(estilo);
        }
    }

    private void fila(Sheet hoja, int indice, Object... valores) {
        Row fila = hoja.createRow(indice);
        for (int i = 0; i < valores.length; i++) {
            Cell celda = fila.createCell(i);
            Object valor = valores[i];
            if (valor instanceof Number numero) {
                celda.setCellValue(numero.doubleValue());
            } else {
                celda.setCellValue(valor == null ? "" : valor.toString());
            }
        }
    }

    private void filaMoneda(Sheet hoja, int indice, String etiqueta, BigDecimal valor, CellStyle estilo) {
        Row fila = hoja.createRow(indice);
        fila.createCell(0).setCellValue(etiqueta);
        Cell celda = fila.createCell(1);
        celda.setCellValue(this.valor(valor));
        celda.setCellStyle(estilo);
    }

    private void ajustarColumnas(Sheet hoja, int columnas) {
        for (int i = 0; i < columnas; i++) {
            hoja.autoSizeColumn(i);
        }
    }

    private PdfPTable tablaIngresos(List<IngresoPeriodoResponse> ingresos) {
        PdfPTable tabla = new PdfPTable(new float[]{3, 1.2f, 2});
        tabla.setWidthPercentage(100);
        tabla.setHeaderRows(1);
        celdaEncabezado(tabla, "Periodo");
        celdaEncabezado(tabla, "Pedidos");
        celdaEncabezado(tabla, "Monto");
        if (ingresos.isEmpty()) {
            celda(tabla, "Sin ventas en el periodo", Element.ALIGN_LEFT);
            celda(tabla, "-", Element.ALIGN_CENTER);
            celda(tabla, "$0", Element.ALIGN_RIGHT);
        } else {
            for (IngresoPeriodoResponse ingreso : ingresos) {
                celda(tabla, ingreso.periodo(), Element.ALIGN_LEFT);
                celda(tabla, String.valueOf(ingreso.pedidos()), Element.ALIGN_CENTER);
                celda(tabla, PdfSoporte.monto(ingreso.monto()), Element.ALIGN_RIGHT);
            }
        }
        return tabla;
    }

    private PdfPTable tablaProductos(List<ProductoVendidoResponse> productos) {
        PdfPTable tabla = new PdfPTable(new float[]{4, 1.2f, 1.8f});
        tabla.setWidthPercentage(100);
        tabla.setHeaderRows(1);
        celdaEncabezado(tabla, "Producto");
        celdaEncabezado(tabla, "Unidades");
        celdaEncabezado(tabla, "Ingresos");
        if (productos.isEmpty()) {
            celda(tabla, "Sin productos vendidos", Element.ALIGN_LEFT);
            celda(tabla, "-", Element.ALIGN_CENTER);
            celda(tabla, "$0", Element.ALIGN_RIGHT);
        } else {
            for (ProductoVendidoResponse producto : productos) {
                celda(tabla, producto.nombre(), Element.ALIGN_LEFT);
                celda(tabla, String.valueOf(producto.unidades()), Element.ALIGN_CENTER);
                celda(tabla, PdfSoporte.monto(producto.ingresos()), Element.ALIGN_RIGHT);
            }
        }
        return tabla;
    }

    private void celdaEncabezado(PdfPTable tabla, String texto) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, PdfSoporte.fuente(9, Font.BOLD)));
        celda.setHorizontalAlignment(Element.ALIGN_CENTER);
        celda.setPadding(4);
        tabla.addCell(celda);
    }

    private void celda(PdfPTable tabla, String texto, int alineacion) {
        PdfPCell celda = new PdfPCell(new Phrase(texto, PdfSoporte.fuente(8, Font.NORMAL)));
        celda.setHorizontalAlignment(alineacion);
        celda.setPadding(4);
        tabla.addCell(celda);
    }

    private double valor(BigDecimal monto) {
        return monto == null ? 0D : monto.doubleValue();
    }
}
