package cl.bioforjarc.pedidos.service;

import cl.bioforjarc.pedidos.dto.ReporteVentasResponse;

import java.time.LocalDate;

public interface ReporteService {

    ReporteVentasResponse generar(LocalDate desde, LocalDate hasta);
}
