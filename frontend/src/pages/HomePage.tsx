import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Recycle } from 'lucide-react'
import { ProductList } from '../components/catalog/ProductList'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { Loading } from '../components/common/Loading'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { useCart } from '../context/CartContext'
import { useNotification } from '../context/NotificationContext'
import { catalogoService } from '../services/catalogo'
import type { Categoria, ProductoResumen } from '../types/api'

const categoriasPortada = [
  {
    slug: 'maceteros',
    nombre: 'Maceteros',
    descripcion: 'Diseños resistentes y amigables con el medio ambiente para tus plantas.',
    imagen: '/assets/imagenes/macetero-1.webp',
  },
  {
    slug: 'articulados',
    nombre: 'Animales articulados',
    descripcion: 'Figuras divertidas y flexibles impresas pieza por pieza.',
    imagen: '/assets/imagenes/articulado-conejo.webp',
  },
  {
    slug: 'sensorial',
    nombre: 'Sensoriales',
    descripcion: 'Juguetes que estimulan el tacto, la coordinación y la creatividad.',
    imagen: '/assets/imagenes/sensorial-cubo.jpg',
  },
  {
    slug: 'figuras',
    nombre: 'Figuras ecológicas',
    descripcion: 'Decoración única creada a partir de plástico PET recuperado.',
    imagen: '/assets/imagenes/figuras-ecologicas.jpg',
  },
]

const pasos = [
  'Recolectamos botellas PET y plásticos limpios en la comunidad.',
  'Lavamos, secamos y trituramos el material para convertirlo en hojuelas.',
  'Extruimos el filamento ecológico que alimenta nuestras impresoras 3D.',
  'Diseñamos e imprimimos cada producto, cuidando terminaciones y calidad.',
]

export function HomePage() {
  const [productos, setProductos] = useState<ProductoResumen[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const { agregar } = useCart()
  const { mostrar } = useNotification()

  useEffect(() => {
    let activo = true
    Promise.all([
      catalogoService.listarProductos({ pagina: 0, tamano: 4 }),
      catalogoService.listarCategorias(),
    ])
      .then(([pagina, listaCategorias]) => {
        if (!activo) return
        setProductos(pagina.contenido)
        setCategorias(listaCategorias)
      })
      .catch((err: unknown) => {
        if (activo) setError(err)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [])

  const agregarAlCarrito = (producto: ProductoResumen) => {
    agregar(producto, 1)
    mostrar(`${producto.nombre} se agregó al carrito`, 'success')
  }

  return (
    <>
      <section className="hero-section">
        <div className="container-page relative z-10 flex flex-col items-center gap-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold tracking-wide text-white uppercase backdrop-blur">
            <Recycle className="size-4" aria-hidden="true" />
            Impresión 3D sustentable
          </span>
          <h1 className="max-w-4xl text-3xl leading-tight text-white sm:text-5xl">
            Transformamos plástico reciclado en productos que inspiran
          </h1>
          <p className="max-w-2xl text-base text-white/85 sm:text-lg">
            Impresión 3D, maceteros ecológicos y figuras únicas creadas a partir de botellas PET
            recuperadas del medio ambiente.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="accent">
              <Link to="/productos">
                Ver productos
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/70 bg-white/5 text-white hover:bg-white hover:text-brand-dark"
            >
              <Link to="/cotizacion">Solicitar cotización</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="section-y">
        <div className="container-page">
          <h2 className="section-title">Nuestras líneas de productos</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {categoriasPortada.map((categoria) => {
              const existe = categorias.some((item) => item.slug === categoria.slug)
              return (
                <Card
                  key={categoria.slug}
                  className="group h-full gap-0 overflow-hidden rounded-2xl py-0 transition-shadow hover:shadow-lg"
                >
                  <img
                    src={categoria.imagen}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    alt={`${categoria.nombre} de BioForjaRC`}
                    loading="lazy"
                  />
                  <CardContent className="flex flex-1 flex-col gap-2 p-5">
                    <h3 className="text-lg font-bold">{categoria.nombre}</h3>
                    <p className="text-sm text-muted-foreground">{categoria.descripcion}</p>
                    <Button asChild variant="outline" size="sm" className="mt-auto self-start">
                      <Link
                        to={
                          existe
                            ? `/productos?categorias=${encodeURIComponent(categoria.slug)}`
                            : '/productos'
                        }
                      >
                        {existe ? 'Explorar' : 'Ver catálogo'}
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-white/60 py-12 sm:py-16">
        <div className="container-page">
          <h2 className="section-title">Productos destacados</h2>
          <p className="page-intro">
            Una selección de nuestros productos más recientes, listos para acompañarte.
          </p>
          {Boolean(error) && <ErrorAlert error={error} />}
          {cargando ? (
            <Loading texto="Cargando productos destacados..." />
          ) : productos.length === 0 ? (
            <div className="rounded-xl border border-sky-200 bg-sky-50 px-5 py-6 text-center text-sm text-sky-900">
              Aún no hay productos publicados. Ingresa al{' '}
              <Link to="/admin/inventario" className="font-semibold underline">
                panel de inventario
              </Link>{' '}
              para agregar el primero.
            </div>
          ) : (
            <ProductList productos={productos} onAgregar={agregarAlCarrito} columnas={4} />
          )}
        </div>
      </section>

      <section className="section-y">
        <div className="container-page">
          <h2 className="section-title">Así nace un producto BioForjaRC</h2>
          <ol className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
            {pasos.map((paso, indice) => (
              <li
                key={paso}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 font-display font-bold text-brand-dark">
                  {indice + 1}
                </span>
                <p className="text-sm text-muted-foreground">{paso}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page">
          <div className="surface-accent flex flex-col items-center gap-4 px-6 py-12 text-center">
            <h2 className="text-2xl font-extrabold text-brand-dark sm:text-3xl">
              ¿Tienes un proyecto en mente?
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              Creamos piezas personalizadas para regalos, eventos, colegios y empresas.
              Cuéntanos tu idea y te prepararemos una cotización.
            </p>
            <Button asChild size="lg" variant="accent" className="mt-2">
              <Link to="/cotizacion">Solicitar cotización personalizada</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
