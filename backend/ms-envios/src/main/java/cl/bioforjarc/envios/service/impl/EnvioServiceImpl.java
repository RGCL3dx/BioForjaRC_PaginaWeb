package cl.bioforjarc.envios.service.impl;

import cl.bioforjarc.envios.dto.ComunaResponse;
import cl.bioforjarc.envios.dto.CotizacionRequest;
import cl.bioforjarc.envios.dto.CotizacionResponse;
import cl.bioforjarc.envios.dto.MetodoDespachoResponse;
import cl.bioforjarc.envios.dto.OpcionEnvioResponse;
import cl.bioforjarc.envios.dto.OpcionesEnvioResponse;
import cl.bioforjarc.envios.dto.RegionResponse;
import cl.bioforjarc.envios.exception.RecursoNoEncontradoException;
import cl.bioforjarc.envios.exception.SolicitudInvalidaException;
import cl.bioforjarc.envios.model.Comuna;
import cl.bioforjarc.envios.model.MetodoDespacho;
import cl.bioforjarc.envios.model.Region;
import cl.bioforjarc.envios.model.TarifaEnvio;
import cl.bioforjarc.envios.repository.ComunaRepository;
import cl.bioforjarc.envios.repository.MetodoDespachoRepository;
import cl.bioforjarc.envios.repository.RegionRepository;
import cl.bioforjarc.envios.repository.TarifaEnvioRepository;
import cl.bioforjarc.envios.service.EnvioService;
import cl.bioforjarc.envios.util.NormalizadorTexto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class EnvioServiceImpl implements EnvioService {

    private static final Map<String, String> ALIAS_REGION = Map.of(
            "libgral", "ohiggins",
            "bio", "biobio",
            "araycan", "araucania",
            "o-higgins", "ohiggins",
            "region-metropolitana", "metropolitana",
            "la-araucania", "araucania",
            "region-de-valparaiso", "valparaiso",
            "region-del-biobio", "biobio",
            "region-de-los-lagos", "los-lagos",
            "region-de-los-rios", "los-rios");

    private static final String ORIGEN_REGION = "REGION";
    private static final String ORIGEN_COMUNA = "COMUNA";
    private static final String ORIGEN_FIJO = "FIJO";

    private final RegionRepository regionRepository;
    private final ComunaRepository comunaRepository;
    private final MetodoDespachoRepository metodoRepository;
    private final TarifaEnvioRepository tarifaRepository;

    public EnvioServiceImpl(RegionRepository regionRepository,
                            ComunaRepository comunaRepository,
                            MetodoDespachoRepository metodoRepository,
                            TarifaEnvioRepository tarifaRepository) {
        this.regionRepository = regionRepository;
        this.comunaRepository = comunaRepository;
        this.metodoRepository = metodoRepository;
        this.tarifaRepository = tarifaRepository;
    }

    @Override
    public List<RegionResponse> listarRegiones() {
        return regionRepository.findAllByOrderByOrdenAsc().stream()
                .map(region -> RegionResponse.desde(region,
                        comunaRepository.findByRegion_CodigoOrderByNombreAsc(region.getCodigo())))
                .toList();
    }

    @Override
    public RegionResponse obtenerRegion(String codigoRegion) {
        Region region = resolverRegion(codigoRegion);
        return RegionResponse.desde(region,
                comunaRepository.findByRegion_CodigoOrderByNombreAsc(region.getCodigo()));
    }

    @Override
    public List<ComunaResponse> listarComunas(String codigoRegion) {
        Region region = resolverRegion(codigoRegion);
        return comunaRepository.findByRegion_CodigoOrderByNombreAsc(region.getCodigo())
                .stream()
                .map(ComunaResponse::desde)
                .toList();
    }

    @Override
    public List<MetodoDespachoResponse> listarMetodos() {
        return metodoRepository.findAllByActivoTrueOrderByOrdenAsc()
                .stream()
                .map(MetodoDespachoResponse::desde)
                .toList();
    }

    @Override
    public CotizacionResponse cotizar(CotizacionRequest solicitud) {
        MetodoDespacho metodo = buscarMetodo(solicitud.metodoCodigo());
        BigDecimal subtotal = normalizarMonto(solicitud.subtotal());

        if (!metodo.isRequiereDireccion()) {
            TarifaCalculada tarifa = tarifaFija(metodo);
            return respuesta(null, null, metodo, subtotal, tarifa);
        }

        Region region = resolverRegion(solicitud.regionCodigo(), solicitud.comuna());
        String comuna = NormalizadorTexto.limpiar(solicitud.comuna());
        TarifaCalculada tarifa = calcularTarifa(region, comuna, metodo);
        return respuesta(region, comuna, metodo, subtotal, tarifa);
    }

    @Override
    public OpcionesEnvioResponse opciones(String regionCodigo, String comuna, BigDecimal subtotal) {
        Region region = resolverRegion(regionCodigo, comuna);
        String comunaLimpia = NormalizadorTexto.limpiar(comuna);
        BigDecimal subtotalNormalizado = normalizarMonto(subtotal);

        List<OpcionEnvioResponse> opciones = metodoRepository.findAllByActivoTrueOrderByOrdenAsc()
                .stream()
                .map(metodo -> {
                    TarifaCalculada tarifa = calcularTarifa(region, comunaLimpia, metodo);
                    return new OpcionEnvioResponse(
                            metodo.getCodigo(),
                            metodo.getNombre(),
                            metodo.getDescripcion(),
                            tarifa.costo(),
                            total(subtotalNormalizado, tarifa.costo()),
                            tarifa.diasHabiles(),
                            metodo.isRequiereDireccion(),
                            tarifa.origen());
                })
                .toList();

        return new OpcionesEnvioResponse(
                region.getCodigo(),
                region.getNombre(),
                comunaLimpia,
                subtotalNormalizado,
                opciones);
    }

    private CotizacionResponse respuesta(Region region, String comuna, MetodoDespacho metodo,
                                         BigDecimal subtotal, TarifaCalculada tarifa) {
        return new CotizacionResponse(
                region == null ? null : region.getCodigo(),
                region == null ? null : region.getNombre(),
                comuna,
                metodo.getCodigo(),
                metodo.getNombre(),
                metodo.getDescripcion(),
                subtotal,
                tarifa.costo(),
                total(subtotal, tarifa.costo()),
                tarifa.diasHabiles(),
                metodo.isRequiereDireccion(),
                tarifa.origen());
    }

    private TarifaCalculada calcularTarifa(Region region, String comuna, MetodoDespacho metodo) {
        if (!metodo.isRequiereDireccion()) {
            return tarifaFija(metodo);
        }

        String slugComuna = NormalizadorTexto.aSlug(comuna);
        if (!slugComuna.isBlank()) {
            Optional<Comuna> comunaRegistrada =
                    comunaRepository.findByRegion_CodigoAndSlug(region.getCodigo(), slugComuna);
            if (comunaRegistrada.isPresent()) {
                Optional<TarifaEnvio> tarifaComuna = tarifaRepository.buscarComuna(
                        region.getCodigo(), slugComuna, metodo.getCodigo());
                if (tarifaComuna.isPresent()) {
                    return desdeTarifa(tarifaComuna.get(), ORIGEN_COMUNA);
                }
            }
        }

        TarifaEnvio tarifaRegion = tarifaRepository.buscarBase(region.getCodigo(), metodo.getCodigo())
                .orElseThrow(() -> new SolicitudInvalidaException(
                        "No existe una tarifa de " + metodo.getNombre()
                                + " para la región " + region.getNombre()));
        return desdeTarifa(tarifaRegion, ORIGEN_REGION);
    }

    private TarifaCalculada tarifaFija(MetodoDespacho metodo) {
        BigDecimal costo = metodo.getCostoFijo() == null
                ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
                : metodo.getCostoFijo().setScale(2, RoundingMode.HALF_UP);
        return new TarifaCalculada(costo, metodo.getDiasHabiles(), ORIGEN_FIJO);
    }

    private TarifaCalculada desdeTarifa(TarifaEnvio tarifa, String origen) {
        return new TarifaCalculada(
                tarifa.getCosto().setScale(2, RoundingMode.HALF_UP),
                tarifa.getDiasHabiles(),
                origen);
    }

    private MetodoDespacho buscarMetodo(String codigo) {
        String buscado = NormalizadorTexto.aSlug(codigo);
        return metodoRepository.findByCodigoIgnoreCaseAndActivoTrue(buscado)
                .orElseThrow(() -> new SolicitudInvalidaException(
                        "El método de despacho '" + codigo + "' no existe o no está disponible"));
    }

    private Region resolverRegion(String codigo) {
        return resolverRegion(codigo, null);
    }

    private Region resolverRegion(String codigo, String comuna) {
        String solicitado = NormalizadorTexto.aSlug(codigo);
        if (!solicitado.isBlank()) {
            String alias = ALIAS_REGION.getOrDefault(solicitado, solicitado);
            Optional<Region> region = regionRepository.findByCodigoIgnoreCase(alias);
            if (region.isPresent()) {
                return region.get();
            }

            return regionRepository.findAllByOrderByOrdenAsc().stream()
                    .filter(candidata -> NormalizadorTexto.aSlug(candidata.getNombre()).equals(solicitado))
                    .findFirst()
                    .orElseThrow(() -> new RecursoNoEncontradoException(
                            "La región '" + codigo + "' no existe"));
        }

        // Permite cotizar indicando solo la comuna cuando su nombre es único.
        String slugComuna = NormalizadorTexto.aSlug(comuna);
        if (slugComuna.isBlank()) {
            throw new SolicitudInvalidaException(
                    "Debe indicar la región o la comuna para calcular el costo de envío");
        }

        List<Comuna> coincidencias = comunaRepository.findBySlug(slugComuna);
        if (coincidencias.size() == 1) {
            return coincidencias.getFirst().getRegion();
        }
        if (coincidencias.size() > 1) {
            throw new SolicitudInvalidaException(
                    "La comuna '" + comuna + "' existe en varias regiones; indique la región");
        }
        throw new RecursoNoEncontradoException(
                "La comuna '" + comuna + "' no existe en el catálogo de envíos; indique la región");
    }

    private BigDecimal normalizarMonto(BigDecimal monto) {
        return (monto == null ? BigDecimal.ZERO : monto).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal total(BigDecimal subtotal, BigDecimal costoEnvio) {
        return subtotal.add(costoEnvio).setScale(2, RoundingMode.HALF_UP);
    }

    private record TarifaCalculada(BigDecimal costo, int diasHabiles, String origen) {
    }
}
