import { Link } from 'react-router-dom'

const compromisos = [
  {
    icono: 'bi-recycle',
    titulo: 'Economía circular',
    texto: 'Cada kilogramo de plástico reciclado reduce residuos y emisiones.',
  },
  {
    icono: 'bi-chat-heart',
    titulo: 'Educación',
    texto: 'Compartimos contenido para que más personas se sumen al reciclaje.',
  },
  {
    icono: 'bi-box-seam',
    titulo: 'Calidad',
    texto: 'Productos resistentes, seguros y aptos para toda la familia.',
  },
  {
    icono: 'bi-house-heart',
    titulo: 'Comunidad',
    texto: 'Apoyamos emprendimientos locales y talleres sustentables.',
  },
]

export function NosotrosPage() {
  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="titulo-seccion">Nosotros</h1>
          <p className="pagina-intro">
            Un emprendimiento chileno que combina reciclaje y tecnología para cuidar el planeta.
          </p>
        </div>
      </section>

      <section className="py-4">
        <div className="container">
          <div className="row g-4 align-items-center">
            <article className="col-lg-6">
              <h2>Nuestra historia</h2>
              <p>
                BioForja<strong>RC</strong> nace con la convicción de que los residuos pueden
                convertirse en algo útil y bello. Recuperamos botellas de plástico PET y otros
                residuos plásticos, los transformamos en filamento ecológico y lo imprimimos en 3D
                para crear maceteros, animales articulados, juegos sensoriales y figuras decorativas.
              </p>
              <p>
                Cada producto cuenta una historia de reciclaje: menos plástico en el vertedero,
                menos emisiones y más conciencia ambiental en los hogares chilenos.
              </p>
              <div className="d-flex flex-wrap gap-3 mt-4">
                <Link to="/cotizacion" className="btn btn-marca rounded-pill px-4">
                  Quiero una cotización
                </Link>
                <Link to="/productos" className="btn btn-marca-outline rounded-pill px-4">
                  Ver productos
                </Link>
              </div>
            </article>
            <figure className="col-lg-6 text-center">
              <img
                src="/assets/imagenes/fondo.webp"
                alt="Producción de filamento reciclado en BioForjaRC"
                className="img-fluid rounded-4 shadow"
              />
              <figcaption className="texto-gris small mt-2">
                Producción de filamento reciclado en BioForjaRC.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="py-4 seccion-clara">
        <div className="container">
          <div className="row g-4">
            <article className="col-md-6">
              <div className="card tarjeta-valor h-100">
                <div className="card-body d-flex gap-3">
                  <i className="bi bi-bullseye fs-1 text-marca" aria-hidden="true" />
                  <div>
                    <h3>Misión</h3>
                    <p className="mb-0">
                      Reducir el impacto ambiental del plástico mediante productos ecológicos,
                      accesibles y de calidad, educando a la comunidad sobre el reciclaje.
                    </p>
                  </div>
                </div>
              </div>
            </article>
            <article className="col-md-6">
              <div className="card tarjeta-valor h-100">
                <div className="card-body d-flex gap-3">
                  <i className="bi bi-eye fs-1 text-marca" aria-hidden="true" />
                  <div>
                    <h3>Visión</h3>
                    <p className="mb-0">
                      Ser referente en economía circular en Chile, demostrando que el reciclaje y la
                      fabricación digital pueden convivir en un modelo de negocio sostenible.
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="py-4">
        <div className="container">
          <h2 className="titulo-seccion">Mira cómo transformamos el plástico</h2>
          <p className="pagina-intro mb-4">
            Este video muestra el proceso de reciclaje de botellas PET y su conversión en filamento
            para impresión 3D.
          </p>
          <div className="col-lg-10 mx-auto">
            <div className="contenedor-video">
              <iframe
                src="https://www.youtube-nocookie.com/embed/qhZfwsaZrnU"
                title="Reciclaje de botellas PET a filamento para impresión 3D"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 seccion-clara">
        <div className="container">
          <h2 className="titulo-seccion">Nuestros compromisos</h2>
          <div className="row g-4">
            {compromisos.map((compromiso) => (
              <article className="col-md-6 col-lg-3" key={compromiso.titulo}>
                <div className="card tarjeta-valor h-100 text-center">
                  <div className="card-body">
                    <i className={`bi ${compromiso.icono} fs-1 text-acento`} aria-hidden="true" />
                    <h3 className="h5">{compromiso.titulo}</h3>
                    <p className="mb-0 small">{compromiso.texto}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
