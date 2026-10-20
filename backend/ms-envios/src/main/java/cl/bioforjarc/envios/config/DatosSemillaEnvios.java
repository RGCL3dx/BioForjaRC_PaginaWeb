package cl.bioforjarc.envios.config;

import cl.bioforjarc.envios.model.Comuna;
import cl.bioforjarc.envios.model.MetodoDespacho;
import cl.bioforjarc.envios.model.Region;
import cl.bioforjarc.envios.model.TarifaEnvio;
import cl.bioforjarc.envios.repository.ComunaRepository;
import cl.bioforjarc.envios.repository.MetodoDespachoRepository;
import cl.bioforjarc.envios.repository.RegionRepository;
import cl.bioforjarc.envios.repository.TarifaEnvioRepository;
import cl.bioforjarc.envios.util.NormalizadorTexto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Carga las 16 regiones, sus comunas, los tres métodos de despacho y las
 * tarifas referenciales. Es idempotente: no duplica ni sobrescribe datos.
 */
@Component
@ConditionalOnProperty(prefix = "bioforja.semilla", name = "habilitada",
        havingValue = "true", matchIfMissing = true)
public class DatosSemillaEnvios implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatosSemillaEnvios.class);

    private final RegionRepository regionRepository;
    private final ComunaRepository comunaRepository;
    private final MetodoDespachoRepository metodoRepository;
    private final TarifaEnvioRepository tarifaRepository;

    public DatosSemillaEnvios(RegionRepository regionRepository,
                              ComunaRepository comunaRepository,
                              MetodoDespachoRepository metodoRepository,
                              TarifaEnvioRepository tarifaRepository) {
        this.regionRepository = regionRepository;
        this.comunaRepository = comunaRepository;
        this.metodoRepository = metodoRepository;
        this.tarifaRepository = tarifaRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        crearRegion("arica", "Arica y Parinacota", 1,
                "Arica", "Putre", "Camarones");
        crearRegion("tarapaca", "Tarapacá", 2,
                "Iquique", "Alto Hospicio", "Pozo Almonte");
        crearRegion("antofagasta", "Antofagasta", 3,
                "Antofagasta", "Calama", "Tocopilla", "Mejillones");
        crearRegion("atacama", "Atacama", 4,
                "Copiapó", "Vallenar", "Caldera", "Chañaral");
        crearRegion("coquimbo", "Coquimbo", 5,
                "La Serena", "Coquimbo", "Ovalle", "Illapel");
        crearRegion("valparaiso", "Valparaíso", 6,
                "Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana",
                "San Antonio", "Isla de Pascua", "Juan Fernández");
        crearRegion("metropolitana", "Región Metropolitana", 7,
                "Santiago", "Puente Alto", "Maipú", "La Florida", "Las Condes",
                "Providencia", "Ñuñoa", "San Bernardo", "Colina", "Melipilla");
        crearRegion("ohiggins", "O'Higgins", 8,
                "Rancagua", "San Fernando", "Rengo", "Santa Cruz");
        crearRegion("maule", "Maule", 9,
                "Talca", "Curicó", "Linares", "Constitución");
        crearRegion("nuble", "Ñuble", 10,
                "Chillán", "San Carlos", "Bulnes");
        crearRegion("biobio", "Biobío", 11,
                "Concepción", "Talcahuano", "Los Ángeles", "Coronel", "Lota");
        crearRegion("araucania", "La Araucanía", 12,
                "Temuco", "Padre Las Casas", "Villarrica", "Angol");
        crearRegion("los-rios", "Los Ríos", 13,
                "Valdivia", "La Unión", "Panguipulli");
        crearRegion("los-lagos", "Los Lagos", 14,
                "Puerto Montt", "Osorno", "Castro", "Chaitén", "Puerto Varas");
        crearRegion("aysen", "Aysén", 15,
                "Coyhaique", "Puerto Aysén", "Chile Chico");
        crearRegion("magallanes", "Magallanes", 16,
                "Punta Arenas", "Puerto Natales", "Puerto Williams");

        crearMetodo("estandar", "Envío estándar",
                "Despacho a domicilio con plazo normal.", true, null, 1);
        crearMetodo("express", "Envío express",
                "Despacho a domicilio prioritario.", true, null, 2);
        crearMetodo("retiro", "Retiro presencial",
                "Retira tu pedido en nuestro taller sin costo de envío.",
                false, BigDecimal.ZERO, 3);

        crearTarifasRegion("arica", 7000, 5, 11000, 3);
        crearTarifasRegion("tarapaca", 6800, 5, 10500, 3);
        crearTarifasRegion("antofagasta", 6500, 4, 10000, 3);
        crearTarifasRegion("atacama", 6000, 4, 9500, 2);
        crearTarifasRegion("coquimbo", 5500, 4, 9000, 2);
        crearTarifasRegion("valparaiso", 4000, 2, 7000, 1);
        crearTarifasRegion("metropolitana", 3500, 2, 6500, 1);
        crearTarifasRegion("ohiggins", 4000, 2, 7000, 1);
        crearTarifasRegion("maule", 4500, 3, 7500, 2);
        crearTarifasRegion("nuble", 5000, 3, 8000, 2);
        crearTarifasRegion("biobio", 5000, 3, 8000, 2);
        crearTarifasRegion("araucania", 5500, 4, 9000, 2);
        crearTarifasRegion("los-rios", 6000, 4, 9500, 2);
        crearTarifasRegion("los-lagos", 6500, 4, 10000, 2);
        crearTarifasRegion("aysen", 8000, 5, 13000, 3);
        crearTarifasRegion("magallanes", 8500, 5, 14000, 3);

        // Excepciones por comuna: zonas de difícil acceso.
        crearTarifaComuna("valparaiso", "Isla de Pascua", "estandar", 12000, 6);
        crearTarifaComuna("valparaiso", "Isla de Pascua", "express", 18000, 4);
        crearTarifaComuna("valparaiso", "Juan Fernández", "estandar", 12000, 6);
        crearTarifaComuna("valparaiso", "Juan Fernández", "express", 18000, 4);
        crearTarifaComuna("los-lagos", "Chaitén", "estandar", 8000, 5);
        crearTarifaComuna("los-lagos", "Chaitén", "express", 12000, 3);
        crearTarifaComuna("magallanes", "Puerto Williams", "estandar", 10000, 6);
        crearTarifaComuna("magallanes", "Puerto Williams", "express", 16000, 4);

        log.info("Datos de envío disponibles: {} regiones, {} comunas, {} métodos, {} tarifas",
                regionRepository.count(), comunaRepository.count(),
                metodoRepository.count(), tarifaRepository.count());
    }

    private void crearRegion(String codigo, String nombre, int orden, String... comunas) {
        Region region = regionRepository.findByCodigoIgnoreCase(codigo).orElseGet(() -> {
            Region nueva = new Region();
            nueva.setCodigo(codigo);
            nueva.setNombre(nombre);
            nueva.setOrden(orden);
            return regionRepository.save(nueva);
        });

        for (String nombreComuna : comunas) {
            String slug = NormalizadorTexto.aSlug(nombreComuna);
            if (!comunaRepository.existsByRegion_CodigoAndSlug(codigo, slug)) {
                Comuna comuna = new Comuna();
                comuna.setNombre(nombreComuna);
                comuna.setSlug(slug);
                comuna.setRegion(region);
                comunaRepository.save(comuna);
            }
        }
    }

    private void crearMetodo(String codigo, String nombre, String descripcion,
                             boolean requiereDireccion, BigDecimal costoFijo, int orden) {
        if (metodoRepository.existsByCodigoIgnoreCase(codigo)) {
            return;
        }
        MetodoDespacho metodo = new MetodoDespacho();
        metodo.setCodigo(codigo);
        metodo.setNombre(nombre);
        metodo.setDescripcion(descripcion);
        metodo.setRequiereDireccion(requiereDireccion);
        metodo.setCostoFijo(costoFijo == null ? null : costoFijo.setScale(2, RoundingMode.HALF_UP));
        metodo.setDiasHabiles(0);
        metodo.setActivo(true);
        metodo.setOrden(orden);
        metodoRepository.save(metodo);
    }

    private void crearTarifasRegion(String codigoRegion, int costoEstandar, int diasEstandar,
                                    int costoExpress, int diasExpress) {
        crearTarifaRegion(codigoRegion, "estandar", costoEstandar, diasEstandar);
        crearTarifaRegion(codigoRegion, "express", costoExpress, diasExpress);
    }

    private void crearTarifaRegion(String codigoRegion, String codigoMetodo, int costo, int dias) {
        String codigo = codigoRegion + "-" + codigoMetodo;
        if (tarifaRepository.existsByCodigo(codigo)) {
            return;
        }
        Region region = regionRepository.findByCodigoIgnoreCase(codigoRegion).orElseThrow();
        MetodoDespacho metodo = metodoRepository.findByCodigoIgnoreCaseAndActivoTrue(codigoMetodo)
                .orElseThrow();
        TarifaEnvio tarifa = new TarifaEnvio();
        tarifa.setCodigo(codigo);
        tarifa.setRegion(region);
        tarifa.setComuna(null);
        tarifa.setMetodo(metodo);
        tarifa.setCosto(monto(costo));
        tarifa.setDiasHabiles(dias);
        tarifaRepository.save(tarifa);
    }

    private void crearTarifaComuna(String codigoRegion, String nombreComuna, String codigoMetodo,
                                   int costo, int dias) {
        String slug = NormalizadorTexto.aSlug(nombreComuna);
        String codigo = codigoRegion + "-" + slug + "-" + codigoMetodo;
        if (tarifaRepository.existsByCodigo(codigo)) {
            return;
        }
        Region region = regionRepository.findByCodigoIgnoreCase(codigoRegion).orElseThrow();
        Comuna comuna = comunaRepository.findByRegion_CodigoAndSlug(codigoRegion, slug).orElseThrow();
        MetodoDespacho metodo = metodoRepository.findByCodigoIgnoreCaseAndActivoTrue(codigoMetodo)
                .orElseThrow();
        TarifaEnvio tarifa = new TarifaEnvio();
        tarifa.setCodigo(codigo);
        tarifa.setRegion(region);
        tarifa.setComuna(comuna);
        tarifa.setMetodo(metodo);
        tarifa.setCosto(monto(costo));
        tarifa.setDiasHabiles(dias);
        tarifaRepository.save(tarifa);
    }

    private BigDecimal monto(int valor) {
        return BigDecimal.valueOf(valor).setScale(2, RoundingMode.HALF_UP);
    }
}
