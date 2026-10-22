import { Link, useSearchParams } from 'react-router-dom'

export function PagoCotizacionPage() {
  const [searchParams] = useSearchParams()
  const ticket = searchParams.get('ticket')

  return (
    <section className="py-5 seccion-clara">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card card-formulario p-4 p-md-5">
              <h1 className="titulo-seccion">Pago de cotización</h1>
              {ticket ? (
                <p className="text-center texto-gris">
                  Ticket de cotización: <strong className="font-monospace">{ticket}</strong>
                </p>
              ) : (
                <p className="text-center texto-gris">
                  No recibimos un ticket de cotización en el enlace.
                </p>
              )}

              <div className="alert alert-warning">
                <h2 className="h6 alert-heading">
                  <i className="bi bi-tools me-2" aria-hidden="true" />
                  Pago en línea en preparación
                </h2>
                <p className="mb-0">
                  La pasarela de pago real aún no está integrada. Para coordinar el pago de tu
                  cotización, escríbenos indicando el número de ticket y te enviaremos los datos de
                  transferencia.
                </p>
              </div>

              <h2 className="h5 fw-bold">¿Qué hago ahora?</h2>
              <ol className="ps-3">
                <li className="mb-2">Revisa el correo con tu presupuesto y verifica monto y plazo.</li>
                <li className="mb-2">Escríbenos si tienes dudas o necesitas ajustar el proyecto.</li>
                <li className="mb-2">
                  Solicita los datos de transferencia indicando el ticket{' '}
                  {ticket && <strong className="font-monospace">{ticket}</strong>}.
                </li>
                <li>Una vez confirmado el pago, coordinamos la producción y entrega.</li>
              </ol>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <a href="mailto:contacto@bioforjarc.cl" className="btn btn-marca rounded-pill px-4">
                  <i className="bi bi-envelope me-1" aria-hidden="true" />
                  Escribir a contacto@bioforjarc.cl
                </a>
                <Link to="/contacto" className="btn btn-marca-outline rounded-pill px-4">
                  Ir al formulario de contacto
                </Link>
                <Link to="/" className="btn btn-outline-secondary rounded-pill px-4">
                  Volver al inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
