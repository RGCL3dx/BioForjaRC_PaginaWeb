package cl.bioforjarc.pedidos.service.impl;

import cl.bioforjarc.pedidos.client.CatalogoClient;
import cl.bioforjarc.pedidos.client.CotizacionEnvio;
import cl.bioforjarc.pedidos.client.EnvioClient;
import cl.bioforjarc.pedidos.client.ProductoValidado;
import cl.bioforjarc.pedidos.client.UsuarioClient;
import cl.bioforjarc.pedidos.client.UsuarioValidado;
import cl.bioforjarc.pedidos.dto.CrearPedidoRequest;
import cl.bioforjarc.pedidos.dto.ItemPedidoRequest;
import cl.bioforjarc.pedidos.dto.PaginaResponse;
import cl.bioforjarc.pedidos.dto.PedidoDetalleResponse;
import cl.bioforjarc.pedidos.dto.PedidoResumenResponse;
import cl.bioforjarc.pedidos.exception.OperacionNoPermitidaException;
import cl.bioforjarc.pedidos.exception.RecursoNoEncontradoException;
import cl.bioforjarc.pedidos.exception.SolicitudInvalidaException;
import cl.bioforjarc.pedidos.model.DetallePedido;
import cl.bioforjarc.pedidos.model.EstadoPago;
import cl.bioforjarc.pedidos.model.EstadoPedido;
import cl.bioforjarc.pedidos.model.Pedido;
import cl.bioforjarc.pedidos.model.TipoDocumento;
import cl.bioforjarc.pedidos.repository.PedidoRepository;
import cl.bioforjarc.pedidos.service.PedidoService;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PedidoServiceImpl implements PedidoService {

    private static final String METODO_RETIRO = "retiro";
    private static final int MAX_INTENTOS_NUMERO = 20;

    private final PedidoRepository pedidoRepository;
    private final UsuarioClient usuarioClient;
    private final CatalogoClient catalogoClient;
    private final EnvioClient envioClient;
    private final SecureRandom random = new SecureRandom();

    public PedidoServiceImpl(PedidoRepository pedidoRepository,
                             UsuarioClient usuarioClient,
                             CatalogoClient catalogoClient,
                             EnvioClient envioClient) {
        this.pedidoRepository = pedidoRepository;
        this.usuarioClient = usuarioClient;
        this.catalogoClient = catalogoClient;
        this.envioClient = envioClient;
    }

    @Override
    @Transactional
    public PedidoDetalleResponse crear(CrearPedidoRequest solicitud, String correo) {
        String correoLimpio = limpiarObligatorio(correo, "No se pudo identificar al usuario autenticado");
        UsuarioValidado usuario = usuarioClient.validar(correoLimpio);
        if (!usuario.existe()) {
            throw new SolicitudInvalidaException("El usuario autenticado no existe");
        }
        if (!usuario.activo()) {
            throw new SolicitudInvalidaException("El usuario autenticado está inactivo");
        }

        validarDocumento(solicitud);
        boolean retiro = METODO_RETIRO.equalsIgnoreCase(solicitud.metodoDespacho().trim());
        if (!retiro) {
            limpiarObligatorio(solicitud.direccion(),
                    "La dirección es obligatoria para el envío a domicilio");
            limpiarObligatorio(solicitud.comuna(),
                    "La comuna es obligatoria para el envío a domicilio");
            limpiarObligatorio(solicitud.regionCodigo(),
                    "La región es obligatoria para el envío a domicilio");
        }

        List<LineaCalculada> lineas = calcularLineas(solicitud.items());
        BigDecimal subtotal = lineas.stream()
                .map(LineaCalculada::subtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        CotizacionEnvio cotizacion = envioClient.cotizar(
                limpiar(solicitud.regionCodigo()),
                limpiar(solicitud.comuna()),
                solicitud.metodoDespacho().trim().toLowerCase(Locale.ROOT),
                subtotal);

        BigDecimal costoEnvio = monto(cotizacion.costoEnvio());
        BigDecimal total = cotizacion.total() == null
                ? subtotal.add(costoEnvio).setScale(2, RoundingMode.HALF_UP)
                : monto(cotizacion.total());

        Pedido pedido = new Pedido();
        pedido.setNumeroOrden(generarNumeroOrden());
        pedido.setUsuarioId(usuario.id());
        pedido.setCorreo(correoLimpio.toLowerCase(Locale.ROOT));
        pedido.setNombre(solicitud.nombre().trim());
        pedido.setApellido(solicitud.apellido().trim());
        pedido.setTelefono(limpiar(solicitud.telefono()));
        pedido.setRut(limpiar(solicitud.rut()));
        pedido.setDocumentoTipo(solicitud.documentoTipo());
        pedido.setRutFacturacion(limpiar(solicitud.rutFacturacion()));
        pedido.setRazonSocial(limpiar(solicitud.razonSocial()));
        pedido.setGiro(limpiar(solicitud.giro()));
        pedido.setDireccion(limpiar(solicitud.direccion()));
        pedido.setComuna(cotizacion.comuna() != null ? cotizacion.comuna() : limpiar(solicitud.comuna()));
        pedido.setRegionCodigo(cotizacion.regionCodigo() != null
                ? cotizacion.regionCodigo() : limpiar(solicitud.regionCodigo()));
        pedido.setRegionNombre(cotizacion.regionNombre());
        pedido.setMetodoDespacho(cotizacion.metodoCodigo() != null
                ? cotizacion.metodoCodigo() : solicitud.metodoDespacho().trim().toLowerCase(Locale.ROOT));
        pedido.setMetodoDespachoNombre(cotizacion.metodoNombre() != null
                ? cotizacion.metodoNombre() : solicitud.metodoDespacho().trim());
        pedido.setDiasHabiles(cotizacion.diasHabiles());
        pedido.setSubtotal(subtotal);
        pedido.setCostoEnvio(costoEnvio);
        pedido.setTotal(total);
        pedido.setMetodoPago(solicitud.metodoPago());
        pedido.setEstadoPago(EstadoPago.PAGADO);
        pedido.setPagoSimulado(true);
        pedido.setReferenciaPago("SIM-" + UUID.randomUUID().toString()
                .substring(0, 12).toUpperCase(Locale.ROOT));
        pedido.setFechaPago(LocalDateTime.now());
        pedido.setEstado(EstadoPedido.EN_PREPARACION);

        for (LineaCalculada linea : lineas) {
            DetallePedido item = new DetallePedido();
            item.setProductoId(linea.productoId());
            item.setNombreProducto(linea.nombre());
            item.setCantidad(linea.cantidad());
            item.setPrecioUnitario(linea.precioUnitario());
            item.setSubtotal(linea.subtotal());
            pedido.agregarItem(item);
        }

        Pedido guardado = pedidoRepository.save(pedido);
        return PedidoDetalleResponse.desde(guardado);
    }

    @Override
    public List<PedidoResumenResponse> listarMios(String correo) {
        String correoLimpio = limpiarObligatorio(correo, "No se pudo identificar al usuario autenticado");
        return pedidoRepository.buscarHistorial(correoLimpio).stream()
                .map(PedidoResumenResponse::desde)
                .toList();
    }

    @Override
    public PaginaResponse<PedidoResumenResponse> listarAdmin(String q, String estado,
                                                             LocalDate desde, LocalDate hasta,
                                                             int pagina, int tamano) {
        if (pagina < 0) {
            throw new SolicitudInvalidaException("La página no puede ser negativa");
        }
        if (tamano < 1 || tamano > 100) {
            throw new SolicitudInvalidaException("El tamaño de página debe estar entre 1 y 100");
        }
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new SolicitudInvalidaException("La fecha desde no puede ser posterior a la fecha hasta");
        }

        EstadoPedido estadoFiltro = estado == null || estado.isBlank()
                ? null : EstadoPedido.desdeTexto(estado);

        Pageable pageable = PageRequest.of(pagina, tamano,
                Sort.by(Sort.Direction.DESC, "fechaCreacion"));
        Page<PedidoResumenResponse> resultado = pedidoRepository
                .findAll(filtro(q, estadoFiltro, desde, hasta), pageable)
                .map(PedidoResumenResponse::desde);
        return PaginaResponse.desde(resultado);
    }

    @Override
    public PedidoDetalleResponse obtener(Long id, String correo, boolean administrador) {
        return PedidoDetalleResponse.desde(obtenerEntidadAutorizada(id, correo, administrador));
    }

    @Override
    @Transactional
    public PedidoDetalleResponse cambiarEstado(Long id, EstadoPedido estado) {
        Pedido pedido = pedidoRepository.buscarDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("El pedido no existe"));
        pedido.setEstado(estado);
        return PedidoDetalleResponse.desde(pedidoRepository.save(pedido));
    }

    @Override
    public Pedido obtenerEntidadAutorizada(Long id, String correo, boolean administrador) {
        Pedido pedido = pedidoRepository.buscarDetalle(id)
                .orElseThrow(() -> new RecursoNoEncontradoException("El pedido no existe"));
        if (!administrador && (correo == null || !pedido.getCorreo().equalsIgnoreCase(correo))) {
            throw new OperacionNoPermitidaException(
                    "No tiene permisos para consultar este pedido");
        }
        return pedido;
    }

    private List<LineaCalculada> calcularLineas(List<ItemPedidoRequest> items) {
        if (items == null || items.isEmpty()) {
            throw new SolicitudInvalidaException("El pedido debe incluir al menos un producto");
        }

        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        for (ItemPedidoRequest item : items) {
            if (item == null || item.productoId() == null) {
                throw new SolicitudInvalidaException("Todos los ítems deben indicar un producto");
            }
            if (item.cantidad() < 1) {
                throw new SolicitudInvalidaException("La cantidad de cada producto debe ser al menos 1");
            }
            int acumulada = cantidades.merge(item.productoId(), item.cantidad(), Integer::sum);
            if (acumulada > 999) {
                throw new SolicitudInvalidaException(
                        "La cantidad máxima por producto es 999");
            }
        }

        List<LineaCalculada> lineas = new ArrayList<>();
        for (Map.Entry<Long, Integer> entrada : cantidades.entrySet()) {
            Long productoId = entrada.getKey();
            int cantidad = entrada.getValue();
            ProductoValidado producto = catalogoClient.validar(productoId, cantidad);

            if (!producto.existe()) {
                throw new SolicitudInvalidaException(
                        "El producto " + productoId + " no existe");
            }
            if (!producto.activo()) {
                throw new SolicitudInvalidaException(
                        "El producto " + producto.nombre() + " no está disponible");
            }
            if (!producto.stockSuficiente()) {
                throw new SolicitudInvalidaException(
                        "Stock insuficiente para " + producto.nombre()
                                + ". Disponible: " + producto.stock());
            }
            if (producto.precio() == null) {
                throw new SolicitudInvalidaException(
                        "El producto " + producto.nombre() + " no tiene precio válido");
            }

            BigDecimal precio = producto.precio().setScale(2, RoundingMode.HALF_UP);
            BigDecimal subtotalLinea = precio.multiply(BigDecimal.valueOf(cantidad))
                    .setScale(2, RoundingMode.HALF_UP);
            lineas.add(new LineaCalculada(
                    productoId, producto.nombre(), cantidad, precio, subtotalLinea));
        }
        return lineas;
    }

    private void validarDocumento(CrearPedidoRequest solicitud) {
        if (solicitud.documentoTipo() == TipoDocumento.FACTURA) {
            if (solicitud.rutFacturacion() == null || solicitud.rutFacturacion().isBlank()) {
                throw new SolicitudInvalidaException(
                        "El RUT de facturación es obligatorio para emitir factura");
            }
            if (solicitud.razonSocial() == null || solicitud.razonSocial().isBlank()) {
                throw new SolicitudInvalidaException(
                        "La razón social es obligatoria para emitir factura");
            }
        }
    }

    private Specification<Pedido> filtro(String q, EstadoPedido estado,
                                         LocalDate desde, LocalDate hasta) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (q != null && !q.isBlank()) {
                String patron = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
                predicados.add(cb.or(
                        cb.like(cb.lower(root.get("numeroOrden")), patron),
                        cb.like(cb.lower(root.get("correo")), patron),
                        cb.like(cb.lower(root.get("nombre")), patron),
                        cb.like(cb.lower(root.get("apellido")), patron)));
            }
            if (estado != null) {
                predicados.add(cb.equal(root.get("estado"), estado));
            }
            if (desde != null) {
                predicados.add(cb.greaterThanOrEqualTo(
                        root.get("fechaCreacion"), desde.atStartOfDay()));
            }
            if (hasta != null) {
                predicados.add(cb.lessThan(
                        root.get("fechaCreacion"), hasta.plusDays(1).atStartOfDay()));
            }
            return cb.and(predicados.toArray(Predicate[]::new));
        };
    }

    private String generarNumeroOrden() {
        String fecha = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        for (int intento = 0; intento < MAX_INTENTOS_NUMERO; intento++) {
            String candidato = "BF-" + fecha + "-" + String.format("%06d", random.nextInt(1_000_000));
            if (!pedidoRepository.existsByNumeroOrden(candidato)) {
                return candidato;
            }
        }
        throw new IllegalStateException("No fue posible generar un número de orden único");
    }

    private String limpiarObligatorio(String valor, String mensaje) {
        if (valor == null || valor.isBlank()) {
            throw new SolicitudInvalidaException(mensaje);
        }
        return valor.trim();
    }

    private String limpiar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim();
    }

    private BigDecimal monto(BigDecimal valor) {
        return (valor == null ? BigDecimal.ZERO : valor).setScale(2, RoundingMode.HALF_UP);
    }

    private record LineaCalculada(
            Long productoId,
            String nombre,
            int cantidad,
            BigDecimal precioUnitario,
            BigDecimal subtotal
    ) {
    }
}
