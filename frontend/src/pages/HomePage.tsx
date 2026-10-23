import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductList } from '../components/catalog/ProductList'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { Loading } from '../components/common/Loading'
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
      <section className="hero">
        <div className="container hero-contenido">
          <h1>Transformamos plástico reciclado en productos que inspiran</h1>
          <p>
            Impresión 3D, maceteros ecológicos y figuras únicas creadas a partir de botellas
            PET recuperadas del medio ambiente.
          </p>
          <Link to="/productos" className="btn btn-acento btn-lg rounded-pill px-4">
            Ver productos
          </Link>
          <Link to="/cotizacion" className="btn btn-outline-light btn-lg rounded-pill px-4">
            Solicitar cotización
          </Link>
        </div>
      </section>

      <section className="py-5">
        <div className="container-xl">
          <h2 className="titulo-seccion">Nuestras líneas de productos</h2>
          <div className="row g-4 row-cols-1 row-cols-sm-2 row-cols-lg-4">
            {categoriasPortada.map((categoria) => {
              const existe = categorias.some((item) => item.slug === categoria.slug)
              return (
                <div className="col" key={categoria.slug}>
                  <article className="card tarjeta-categoria h-100">
                    <img
                      src={categoria.imagen}
                      className="card-img-top"
                      alt={`${categoria.nombre} de BioForjaRC`}
                      loading="lazy"
                    />
                    <div className="card-body">
                      <h3>{categoria.nombre}</h3>
                      <p>{categoria.descripcion}</p>
                      {existe ? (
                        <Link
                          to={`/productos?categorias=${encodeURIComponent(categoria.slug)}`}
                          className="btn btn-marca-outline rounded-pill px-3"
                        >
                          Explorar
                        </Link>
                      ) : (
                        <Link to="/productos" className="btn btn-marca-outline rounded-pill px-3">
                          Ver catálogo
                        </Link>
                      )}
                    </div>
                  </article>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="container-xl">
          <h2 className="titulo-seccion">Productos destacados</h2>
          <p className="pagina-intro mb-4">
            Una selección de nuestros productos más recientes, listos para acompañarte.
          </p>
          {Boolean(error) && <ErrorAlert error={error} />}
          {cargando ? (
            <Loading texto="Cargando productos destacados..." />
          ) : productos.length === 0 ? (
            <div className="alert alert-info text-center">
              Aún no hay productos publicados. Ingresa al{' '}
              <Link to="/admin/inventario" className="alert-link">
                panel de inventario
              </Link>{' '}
              para agregar el primero.
            </div>
          ) : (
            <ProductList
              productos={productos}
              onAgregar={agregarAlCarrito}
              columnas="row-cols-1 row-cols-sm-2 row-cols-lg-4"
            />
          )}
        </div>
      </section>

      <section className="py-5 seccion-clara">
        <div className="container">
          <h2 className="titulo-seccion">Así nace un producto BioForjaRC</h2>
          <ol className="lista-proceso">
            {pasos.map((paso) => (
              <li key={paso}>{paso}</li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-5">
        <div className="container text-center">
          <h2 className="titulo-seccion">¿Tienes un proyecto en mente?</h2>
          <p className="pagina-intro">
            Creamos piezas personalizadas para regalos, eventos, colegios y empresas. Cuéntanos
            tu idea y te prepararemos una cotización.
          </p>
          <Link to="/cotizacion" className="btn btn-acento btn-lg rounded-pill px-4 mt-3">
            Solicitar cotización personalizada
          </Link>
        </div>
      </section>
    </>
  )
}
