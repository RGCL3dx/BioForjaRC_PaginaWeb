import { Link, useSearchParams } from 'react-router-dom'
import { Mail, Wrench } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'

export function PagoCotizacionPage() {
  const [searchParams] = useSearchParams()
  const ticket = searchParams.get('ticket')

  return (
    <section className="bg-white/40 py-14">
      <div className="container-page max-w-3xl">
        <Card className="gap-5 p-6 sm:p-8">
          <h1 className="section-title mx-auto">Pago de cotización</h1>
          {ticket ? (
            <p className="text-center text-muted-foreground">
              Ticket de cotización:{' '}
              <strong className="font-mono text-foreground">{ticket}</strong>
            </p>
          ) : (
            <p className="text-center text-muted-foreground">
              No recibimos un ticket de cotización en el enlace.
            </p>
          )}

          <Alert variant="warning">
            <Wrench aria-hidden="true" />
            <AlertTitle>Pago en línea en preparación</AlertTitle>
            <AlertDescription>
              La pasarela de pago real aún no está integrada. Para coordinar el pago de tu
              cotización, escríbenos indicando el número de ticket y te enviaremos los datos de
              transferencia.
            </AlertDescription>
          </Alert>

          <div>
            <h2 className="mb-2 text-lg font-bold">¿Qué hago ahora?</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted-foreground">
              <li>Revisa el correo con tu presupuesto y verifica monto y plazo.</li>
              <li>Escríbenos si tienes dudas o necesitas ajustar el proyecto.</li>
              <li>
                Solicita los datos de transferencia indicando el ticket{' '}
                {ticket && <strong className="font-mono text-foreground">{ticket}</strong>}.
              </li>
              <li>Una vez confirmado el pago, coordinamos la producción y entrega.</li>
            </ol>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <a href="mailto:contacto@bioforjarc.cl">
                <Mail className="size-4" aria-hidden="true" />
                Escribir a contacto@bioforjarc.cl
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contacto">Ir al formulario de contacto</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/">Volver al inicio</Link>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  )
}
