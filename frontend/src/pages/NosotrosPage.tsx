import { Link } from 'react-router-dom'
import { Eye, GraduationCap, HeartHandshake, PackageCheck, Recycle, Target } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'

const compromisos = [
  {
    icono: Recycle,
    titulo: 'Economía circular',
    texto: 'Cada kilogramo de plástico reciclado reduce residuos y emisiones.',
  },
  {
    icono: GraduationCap,
    titulo: 'Educación',
    texto: 'Compartimos contenido para que más personas se sumen al reciclaje.',
  },
  {
    icono: PackageCheck,
    titulo: 'Calidad',
    texto: 'Productos resistentes, seguros y aptos para toda la familia.',
  },
  {
    icono: HeartHandshake,
    titulo: 'Comunidad',
    texto: 'Apoyamos emprendimientos locales y talleres sustentables.',
  },
]

export function NosotrosPage() {
  return (
    <>
      <section className="pt-10 pb-6">
        <div className="container-page text-center">
          <h1 className="section-title">Nosotros</h1>
          <p className="page-intro mb-0">
            Un emprendimiento chileno que combina reciclaje y tecnología para cuidar el planeta.
          </p>
        </div>
      </section>

      <section className="pb-14">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <article>
            <h2 className="mb-3 text-2xl font-extrabold">Nuestra historia</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                BioForja<strong className="text-brand">RC</strong> nace con la convicción de que los
                residuos pueden convertirse en algo útil y bello. Recuperamos botellas de plástico
                PET y otros residuos plásticos, los transformamos en filamento ecológico y lo
                imprimimos en 3D para crear maceteros, animales articulados, juegos sensoriales y
                figuras decorativas.
              </p>
              <p>
                Cada producto cuenta una historia de reciclaje: menos plástico en el vertedero,
                menos emisiones y más conciencia ambiental en los hogares chilenos.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/cotizacion">Quiero una cotización</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/productos">Ver productos</Link>
              </Button>
            </div>
          </article>
          <figure className="text-center">
            <img
              src="/assets/imagenes/fondo.webp"
              alt="Producción de filamento reciclado en BioForjaRC"
              className="w-full rounded-2xl object-cover shadow-lg"
            />
            <figcaption className="mt-2 text-sm text-muted-foreground">
              Producción de filamento reciclado en BioForjaRC.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="bg-white/60 py-12">
        <div className="container-page grid gap-5 md:grid-cols-2">
          <Card className="gap-0 p-6">
            <div className="flex gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Target className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h3 className="mb-1 text-lg">Misión</h3>
                <p className="text-sm text-muted-foreground">
                  Reducir el impacto ambiental del plástico mediante productos ecológicos,
                  accesibles y de calidad, educando a la comunidad sobre el reciclaje.
                </p>
              </div>
            </div>
          </Card>
          <Card className="gap-0 p-6">
            <div className="flex gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Eye className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h3 className="mb-1 text-lg">Visión</h3>
                <p className="text-sm text-muted-foreground">
                  Ser referente en economía circular en Chile, demostrando que el reciclaje y la
                  fabricación digital pueden convivir en un modelo de negocio sostenible.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="section-y">
        <div className="container-page">
          <h2 className="section-title">Mira cómo transformamos el plástico</h2>
          <p className="page-intro">
            Este video muestra el proceso de reciclaje de botellas PET y su conversión en filamento
            para impresión 3D.
          </p>
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-border bg-black shadow-lg">
            <div className="aspect-video">
              <iframe
                className="size-full"
                src="https://www.youtube-nocookie.com/embed/qhZfwsaZrnU"
                title="Reciclaje de botellas PET a filamento para impresión 3D"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white/60 py-12">
        <div className="container-page">
          <h2 className="section-title">Nuestros compromisos</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {compromisos.map((compromiso) => {
              const Icono = compromiso.icono
              return (
                <Card key={compromiso.titulo} className="gap-0 text-center">
                  <CardContent className="flex flex-col items-center gap-2 p-6">
                    <span className="mb-1 flex size-12 items-center justify-center rounded-xl bg-amber-brand/15 text-amber-brand-dark">
                      <Icono className="size-6" aria-hidden="true" />
                    </span>
                    <h3 className="text-base">{compromiso.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{compromiso.texto}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
