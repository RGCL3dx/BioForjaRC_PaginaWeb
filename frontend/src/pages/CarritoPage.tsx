import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { EmptyState } from '../components/common/EmptyState'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useNotification } from '../context/NotificationContext'
import { assetUrl, formatCLP } from '../utils/format'

export function CarritoPage() {
  const { items, subtotal, cantidadTotal, actualizarCantidad, eliminar, vaciar } = useCart()
  const { usuario } = useAuth()
  const { mostrar } = useNotification()
  const [confirmarVaciar, setConfirmarVaciar] = useState(false)

  const vaciarCarrito = () => {
    vaciar()
    setConfirmarVaciar(false)
    mostrar('El carrito quedó vacío', 'info')
  }

  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="titulo-seccion">Tu carrito de compras</h1>
          <p className="pagina-intro">
            Revisa los productos que has seleccionado antes de continuar con el pago.
          </p>
        </div>
      </section>

      <section className="py-4">
        <div className="container">
          {items.length === 0 ? (
            <EmptyState
              titulo="Tu carrito está vacío"
              descripcion="Explora el catálogo y agrega productos hechos con plástico reciclado."
              accion={
                <Link to="/productos" className="btn btn-marca btn-lg rounded-pill px-4">
                  Ver productos
                </Link>
              }
            />
          ) : (
            <div className="row g-4">
              <div className="col-lg-8">
                <div className="card card-formulario p-3 p-md-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <h2 className="h5 fw-bold mb-0">
                      Productos ({cantidadTotal} unidad{cantidadTotal === 1 ? '' : 'es'})
                    </h2>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger rounded-pill"
                      onClick={() => setConfirmarVaciar(true)}
                    >
                      <i className="bi bi-trash me-1" aria-hidden="true" />
                      Vaciar carrito
                    </button>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle tabla-marca mb-0">
                      <thead>
                        <tr>
                          <th scope="col">Producto</th>
                          <th scope="col">Precio</th>
                          <th scope="col">Cantidad</th>
                          <th scope="col">Subtotal</th>
                          <th scope="col" className="text-end">
                            Quitar
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.producto.id}>
                            <td>
                              <div className="d-flex align-items-center gap-3">
                                <img
                                  src={assetUrl(item.producto.imagen)}
                                  alt={item.producto.nombre}
                                  width={70}
                                  height={70}
                                  className="rounded-3"
                                  style={{ objectFit: 'cover' }}
                                />
                                <div>
                                  <Link
                                    to={`/productos/${item.producto.id}`}
                                    className="fw-bold text-reset d-block"
                                  >
                                    {item.producto.nombre}
                                  </Link>
                                  <span className="small texto-gris">
                                    {item.producto.categoria.nombre}
                                  </span>
                                  <span className="small texto-gris d-block">
                                    Disponible: {item.producto.stock}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>{formatCLP(item.producto.precio)}</td>
                            <td>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                min={1}
                                max={Math.max(1, item.producto.stock)}
                                value={item.cantidad}
                                aria-label={`Cantidad de ${item.producto.nombre}`}
                                onChange={(event) =>
                                  actualizarCantidad(
                                    item.producto.id,
                                    Number(event.target.value) || 1,
                                  )
                                }
                                style={{ width: '80px' }}
                              />
                            </td>
                            <td className="fw-bold">
                              {formatCLP(Number(item.producto.precio) * item.cantidad)}
                            </td>
                            <td className="text-end">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger rounded-circle"
                                aria-label={`Quitar ${item.producto.nombre}`}
                                onClick={() => {
                                  eliminar(item.producto.id)
                                  mostrar(`${item.producto.nombre} se quitó del carrito`, 'info')
                                }}
                              >
                                <i className="bi bi-x-lg" aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2 mt-3">
                  <Link to="/productos" className="btn btn-marca-outline rounded-pill px-4">
                    <i className="bi bi-arrow-left me-1" aria-hidden="true" />
                    Seguir comprando
                  </Link>
                </div>
              </div>

              <div className="col-lg-4">
                <div className="card card-formulario p-4 sticky-lg-top" style={{ top: '100px' }}>
                  <h2 className="h5 fw-bold mb-3">Resumen de la compra</h2>
                  <dl className="row mb-2">
                    <dt className="col-7 fw-normal texto-gris">Subtotal productos</dt>
                    <dd className="col-5 text-end mb-0">{formatCLP(subtotal)}</dd>
                    <dt className="col-7 fw-normal texto-gris">Envío</dt>
                    <dd className="col-5 text-end mb-0 small">Se calcula al pagar</dd>
                  </dl>
                  <hr />
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="fw-bold">Total estimado</span>
                    <span className="fs-4 fw-bold texto-marca">{formatCLP(subtotal)}</span>
                  </div>
                  <Link to="/checkout" className="btn btn-marca btn-lg rounded-pill w-100">
                    Continuar al pago
                  </Link>
                  {!usuario && (
                    <p className="small texto-gris text-center mt-3 mb-0">
                      Debes <Link to="/login">iniciar sesión</Link> para completar la compra.
                    </p>
                  )}
                  <p className="small texto-gris text-center mt-3 mb-0">
                    El costo de envío depende de la región, comuna y método seleccionado.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <ConfirmModal
        abierto={confirmarVaciar}
        titulo="Vaciar carrito"
        textoConfirmar="Sí, vaciar"
        onConfirmar={vaciarCarrito}
        onCancelar={() => setConfirmarVaciar(false)}
      >
        <p className="mb-0">Se quitarán todos los productos del carrito. Esta acción no se puede deshacer.</p>
      </ConfirmModal>
    </>
  )
}
