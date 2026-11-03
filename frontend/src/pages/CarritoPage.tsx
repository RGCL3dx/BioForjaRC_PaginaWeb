import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2, X } from 'lucide-react'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { EmptyState } from '../components/common/EmptyState'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import type { CartItem } from '../context/CartContext'
import { useNotification } from '../context/NotificationContext'
import { assetUrl, formatCLP } from '../utils/format'

export function CarritoPage() {
  const { items, subtotal, cantidadTotal, actualizarCantidad, eliminar, vaciar } = useCart()
  const { usuario } = useAuth()
  const { mostrar } = useNotification()
  const [confirmarVaciar, setConfirmarVaciar] = useState(false)
  const [itemAQuitar, setItemAQuitar] = useState<CartItem | null>(null)

  const vaciarCarrito = () => {
    vaciar()
    setConfirmarVaciar(false)
    mostrar('El carrito quedó vacío', 'info')
  }

  const quitarProducto = () => {
    if (!itemAQuitar) return
    eliminar(itemAQuitar.producto.id)
    mostrar(`${itemAQuitar.producto.nombre} se quitó del carrito`, 'info')
    setItemAQuitar(null)
  }

  return (
    <>
      <section className="pt-10 pb-6">
        <div className="container-page text-center">
          <h1 className="section-title">Tu carrito de compras</h1>
          <p className="page-intro mb-0">
            Revisa los productos que has seleccionado antes de continuar con el pago.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page">
          {items.length === 0 ? (
            <EmptyState
              titulo="Tu carrito está vacío"
              descripcion="Explora el catálogo y agrega productos hechos con plástico reciclado."
              accion={
                <Button asChild size="lg">
                  <Link to="/productos">
                    <ShoppingCart className="size-4" aria-hidden="true" />
                    Ver productos
                  </Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
              <div>
                <Card className="gap-4 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-bold">
                      Productos ({cantidadTotal} unidad{cantidadTotal === 1 ? '' : 'es'})
                    </h2>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="border-destructive/40 text-destructive hover:bg-destructive hover:text-white"
                      onClick={() => setConfirmarVaciar(true)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Vaciar carrito
                    </Button>
                  </div>

                  <div className="table-wrap">
                    <Table className="min-w-[640px]">
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Producto</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Subtotal</TableHead>
                          <TableHead className="text-right">Quitar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.producto.id}>
                            <TableCell className="whitespace-normal">
                              <div className="flex items-center gap-3">
                                <img
                                  src={assetUrl(item.producto.imagen)}
                                  alt={item.producto.nombre}
                                  width={70}
                                  height={70}
                                  className="size-16 shrink-0 rounded-lg object-cover"
                                />
                                <div>
                                  <Link
                                    to={`/productos/${item.producto.id}`}
                                    className="block font-semibold hover:text-primary"
                                  >
                                    {item.producto.nombre}
                                  </Link>
                                  <span className="text-xs text-muted-foreground">
                                    {item.producto.categoria.nombre}
                                  </span>
                                  <span className="block text-xs text-muted-foreground">
                                    Disponible: {item.producto.stock}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{formatCLP(item.producto.precio)}</TableCell>
                            <TableCell>
                              <div className="inline-flex items-center rounded-full border border-border bg-white">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-full"
                                  aria-label={`Disminuir cantidad de ${item.producto.nombre}`}
                                  onClick={() =>
                                    actualizarCantidad(item.producto.id, item.cantidad - 1)
                                  }
                                  disabled={item.cantidad <= 1}
                                >
                                  <Minus className="size-3.5" aria-hidden="true" />
                                </Button>
                                <input
                                  type="number"
                                  className="w-12 border-0 bg-transparent text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
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
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 rounded-full"
                                  aria-label={`Aumentar cantidad de ${item.producto.nombre}`}
                                  onClick={() =>
                                    actualizarCantidad(item.producto.id, item.cantidad + 1)
                                  }
                                  disabled={item.cantidad >= item.producto.stock}
                                >
                                  <Plus className="size-3.5" aria-hidden="true" />
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="font-bold">
                              {formatCLP(Number(item.producto.precio) * item.cantidad)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8 rounded-full text-destructive hover:bg-destructive hover:text-white"
                                aria-label={`Quitar ${item.producto.nombre}`}
                                onClick={() => setItemAQuitar(item)}
                              >
                                <X className="size-4" aria-hidden="true" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link to="/productos">
                      <ArrowLeft className="size-4" aria-hidden="true" />
                      Seguir comprando
                    </Link>
                  </Button>
                </div>
              </div>

              <div>
                <Card className="gap-3 p-5 lg:sticky lg:top-24">
                  <h2 className="text-lg font-bold">Resumen de la compra</h2>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Subtotal productos</dt>
                      <dd>{formatCLP(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-muted-foreground">Envío</dt>
                      <dd className="text-xs text-muted-foreground">Se calcula al pagar</dd>
                    </div>
                  </dl>
                  <hr className="border-border" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Total estimado</span>
                    <span className="font-display text-2xl font-extrabold text-primary">
                      {formatCLP(subtotal)}
                    </span>
                  </div>
                  <Button asChild size="lg" className="w-full">
                    <Link to="/checkout">Continuar al pago</Link>
                  </Button>
                  {!usuario && (
                    <p className="text-center text-xs text-muted-foreground">
                      Debes{' '}
                      <Link to="/login" className="font-semibold text-primary hover:underline">
                        iniciar sesión
                      </Link>{' '}
                      para completar la compra.
                    </p>
                  )}
                  <p className="text-center text-xs text-muted-foreground">
                    El costo de envío depende de la región, comuna y método seleccionado.
                  </p>
                </Card>
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
        <p className="mb-0">
          Se quitarán todos los productos del carrito. Esta acción no se puede deshacer.
        </p>
      </ConfirmModal>

      <ConfirmModal
        abierto={Boolean(itemAQuitar)}
        titulo="Quitar producto"
        textoConfirmar="Quitar"
        onConfirmar={quitarProducto}
        onCancelar={() => setItemAQuitar(null)}
      >
        <p className="mb-0">
          ¿Quitar <strong>{itemAQuitar?.producto.nombre}</strong> del carrito?
        </p>
      </ConfirmModal>
    </>
  )
}
