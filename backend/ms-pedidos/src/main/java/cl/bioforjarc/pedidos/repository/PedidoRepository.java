package cl.bioforjarc.pedidos.repository;

import cl.bioforjarc.pedidos.model.EstadoPago;
import cl.bioforjarc.pedidos.model.EstadoPedido;
import cl.bioforjarc.pedidos.model.Pedido;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long>, JpaSpecificationExecutor<Pedido> {

    boolean existsByNumeroOrden(String numeroOrden);

    @EntityGraph(attributePaths = "items")
    @Query("select distinct p from Pedido p left join fetch p.items where p.id = :id")
    Optional<Pedido> buscarDetalle(@Param("id") Long id);

    @EntityGraph(attributePaths = "items")
    @Query("""
            select distinct p from Pedido p
            left join fetch p.items
            where lower(p.correo) = lower(:correo)
            order by p.fechaCreacion desc
            """)
    List<Pedido> buscarHistorial(@Param("correo") String correo);

    @EntityGraph(attributePaths = "items")
    @Query("""
            select distinct p from Pedido p
            left join fetch p.items
            where p.fechaCreacion >= :desde
              and p.fechaCreacion < :hasta
              and p.estado <> :cancelado
              and p.estadoPago = :pagado
            order by p.fechaCreacion asc
            """)
    List<Pedido> buscarParaReporte(@Param("desde") LocalDateTime desde,
                                   @Param("hasta") LocalDateTime hasta,
                                   @Param("cancelado") EstadoPedido cancelado,
                                   @Param("pagado") EstadoPago pagado);
}
