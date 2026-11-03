import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '../components/ui/button'

export function NotFoundPage() {
  return (
    <section className="py-20">
      <div className="container-page flex flex-col items-center text-center">
        <span className="mb-4 flex size-16 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Compass className="size-8" aria-hidden="true" />
        </span>
        <h1 className="section-title">Página no encontrada</h1>
        <p className="page-intro">
          La dirección que intentaste abrir no existe o fue movida.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/productos">Ver productos</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
