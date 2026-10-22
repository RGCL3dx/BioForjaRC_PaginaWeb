import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { cotizacionService } from '../services/cotizaciones'
import type { CotizacionDetalle } from '../types/api'

interface FormularioCotizacion {
  nombre: string
  apellido: string
  correo: string
  telefono: string
  categoria: string
  cantidad: string
  plazo: string
  descripcion: string
}

const formularioInicial: FormularioCotizacion = {
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  categoria: '',
  cantidad: '',
  plazo: '',
  descripcion: '',
}

const MAX_ARCHIVOS = 5
const MAX_TAMANO = 50 * 1024 * 1024

function tamanoLegible(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${bytes} B`
}

export function CotizacionPage() {
  const [searchParams] = useSearchParams()
  const producto = searchParams.get('producto')
  const [formulario, setFormulario] = useState<FormularioCotizacion>({
    ...formularioInicial,
    descripcion: producto ? `Hola, quiero cotizar ${producto}. ` : '',
  })
  const [archivos, setArchivos] = useState<File[]>([])
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState<unknown>(null)
  const [errorArchivos, setErrorArchivos] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<CotizacionDetalle | null>(null)
  const archivoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (producto) {
      setFormulario((actual) => ({
        ...actual,
        descripcion: actual.descripcion || `Hola, quiero cotizar ${producto}. `,
      }))
    }
  }, [producto])

  const actualizar = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
  }

  const agregarArchivos = (event: ChangeEvent<HTMLInputElement>) => {
    setErrorArchivos(null)
    const seleccionados = Array.from(event.target.files ?? [])
    if (seleccionados.length === 0) return

    const nuevos: File[] = [...archivos]
    for (const archivo of seleccionados) {
      const extension = archivo.name.split('.').pop()?.toLowerCase()
      if (extension !== 'stl' && extension !== 'obj') {
        setErrorArchivos(`"${archivo.name}" no es un archivo .STL o .OBJ válido.`)
        continue
      }
      if (archivo.size > MAX_TAMANO) {
        setErrorArchivos(`"${archivo.name}" supera el máximo de 50 MB por archivo.`)
        continue
      }
      const duplicado = nuevos.some(
        (item) => item.name === archivo.name && item.size === archivo.size,
      )
      if (!duplicado) nuevos.push(archivo)
    }
    if (nuevos.length > MAX_ARCHIVOS) {
      setErrorArchivos(`Puedes adjuntar como máximo ${MAX_ARCHIVOS} archivos.`)
      setArchivos(nuevos.slice(0, MAX_ARCHIVOS))
    } else {
      setArchivos(nuevos)
    }
    if (archivoInputRef.current) archivoInputRef.current.value = ''
  }

  const quitarArchivo = (indice: number) => {
    setArchivos((actuales) => actuales.filter((_, posicion) => posicion !== indice))
  }

  const validar = (): boolean => {
    const nuevos: Record<string, string> = {}
    if (!formulario.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio'
    if (!formulario.apellido.trim()) nuevos.apellido = 'El apellido es obligatorio'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo.trim())) {
      nuevos.correo = 'Ingresa un correo válido'
    }
    if (formulario.telefono && !/^[+0-9 ()-]{6,30}$/.test(formulario.telefono.trim())) {
      nuevos.telefono = 'El teléfono contiene caracteres no válidos'
    }
    if (!formulario.categoria) nuevos.categoria = 'Selecciona una categoría'
    if (formulario.cantidad && Number(formulario.cantidad) < 1) {
      nuevos.cantidad = 'La cantidad debe ser mayor o igual a 1'
    }
    if (formulario.descripcion.trim().length < 10) {
      nuevos.descripcion = 'La descripción debe tener al menos 10 caracteres'
    }
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!validar()) return
    if (errorArchivos) {
      setError(new Error('Revisa los archivos adjuntos antes de enviar la cotización.'))
      return
    }
    setEnviando(true)
    try {
      const respuesta = await cotizacionService.crear({
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        correo: formulario.correo.trim(),
        telefono: formulario.telefono.trim() || undefined,
        categoria: formulario.categoria,
        cantidad: formulario.cantidad ? Number(formulario.cantidad) : undefined,
        plazo: formulario.plazo || undefined,
        descripcion: formulario.descripcion.trim(),
        archivos,
      })
      setResultado(respuesta)
      setFormulario(formularioInicial)
      setArchivos([])
      setErrores({})
      setErrorArchivos(null)
    } catch (err: unknown) {
      setError(err)
    } finally {
      setEnviando(false)
    }
  }

  const campoClase = (campo: string) => `form-control${errores[campo] ? ' is-invalid' : ''}`

  if (resultado) {
    return (
      <section className="py-5 seccion-clara">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card card-formulario p-4 p-md-5 text-center">
                <i className="bi bi-check-circle-fill text-success fs-1 mb-3" aria-hidden="true" />
                <h1 className="h3">Solicitud recibida</h1>
                <p className="texto-gris">
                  Gracias, {resultado.nombre}. Tu solicitud de cotización fue registrada con el
                  ticket:
                </p>
                <p className="fs-3 fw-bold texto-marca font-monospace">{resultado.numeroTicket}</p>
                <p className="texto-gris">
                  Te contactaremos a <strong>{resultado.correo}</strong> con el presupuesto y los
                  próximos pasos. También puedes responder al correo de confirmación.
                </p>
                {resultado.archivos.length > 0 && (
                  <p className="small texto-gris">
                    Adjuntaste {resultado.archivos.length} archivo
                    {resultado.archivos.length === 1 ? '' : 's'} 3D.
                  </p>
                )}
                <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
                  <button
                    type="button"
                    className="btn btn-marca rounded-pill px-4"
                    onClick={() => setResultado(null)}
                  >
                    Enviar otra cotización
                  </button>
                  <Link to="/productos" className="btn btn-marca-outline rounded-pill px-4">
                    Ver productos
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="titulo-seccion">Cotización personalizada</h1>
          <p className="pagina-intro">
            Cuéntanos qué necesitas y te enviaremos una cotización a la medida de tu proyecto.
          </p>
        </div>
      </section>

      <section className="py-4 seccion-clara">
        <div className="container">
          {producto && (
            <div className="alert alert-info max-w-720 mx-auto">
              <i className="bi bi-info-circle me-2" aria-hidden="true" />
              Estás cotizando: <strong>{producto}</strong>. Puedes ajustar la descripción.
            </div>
          )}
          <div className="row g-4 justify-content-center">
            <div className="col-lg-8">
              <form className="card card-formulario p-4 p-md-5" onSubmit={enviar} noValidate>
                {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}

                <div className="row g-3">
                  <div className="col-md-6">
                    <label htmlFor="nombre" className="form-label">
                      Nombre *
                    </label>
                    <input
                      id="nombre"
                      name="nombre"
                      className={campoClase('nombre')}
                      value={formulario.nombre}
                      onChange={actualizar}
                      autoComplete="given-name"
                      maxLength={80}
                      required
                    />
                    {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="apellido" className="form-label">
                      Apellido *
                    </label>
                    <input
                      id="apellido"
                      name="apellido"
                      className={campoClase('apellido')}
                      value={formulario.apellido}
                      onChange={actualizar}
                      autoComplete="family-name"
                      maxLength={80}
                      required
                    />
                    {errores.apellido && <div className="invalid-feedback">{errores.apellido}</div>}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="correo" className="form-label">
                      Correo electrónico *
                    </label>
                    <input
                      id="correo"
                      name="correo"
                      type="email"
                      className={campoClase('correo')}
                      value={formulario.correo}
                      onChange={actualizar}
                      autoComplete="email"
                      maxLength={150}
                      required
                    />
                    {errores.correo && <div className="invalid-feedback">{errores.correo}</div>}
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="telefono" className="form-label">
                      Teléfono
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      className={campoClase('telefono')}
                      value={formulario.telefono}
                      onChange={actualizar}
                      autoComplete="tel"
                      maxLength={30}
                    />
                    {errores.telefono && <div className="invalid-feedback">{errores.telefono}</div>}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="categoria" className="form-label">
                      Categoría *
                    </label>
                    <select
                      id="categoria"
                      name="categoria"
                      className={`form-select${errores.categoria ? ' is-invalid' : ''}`}
                      value={formulario.categoria}
                      onChange={actualizar}
                      required
                    >
                      <option value="">-- Selecciona --</option>
                      <option value="maceteros">Maceteros</option>
                      <option value="articulados">Animales articulados</option>
                      <option value="sensorial">Juguetes sensoriales</option>
                      <option value="figuras">Figuras ecológicas</option>
                      <option value="otro">Otro</option>
                    </select>
                    {errores.categoria && <div className="invalid-feedback">{errores.categoria}</div>}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="cantidad" className="form-label">
                      Cantidad estimada
                    </label>
                    <input
                      id="cantidad"
                      name="cantidad"
                      type="number"
                      min={1}
                      className={campoClase('cantidad')}
                      value={formulario.cantidad}
                      onChange={actualizar}
                      placeholder="Ej: 20"
                    />
                    {errores.cantidad && <div className="invalid-feedback">{errores.cantidad}</div>}
                  </div>
                  <div className="col-md-4">
                    <label htmlFor="plazo" className="form-label">
                      Plazo deseado
                    </label>
                    <select
                      id="plazo"
                      name="plazo"
                      className="form-select"
                      value={formulario.plazo}
                      onChange={actualizar}
                    >
                      <option value="">-- Sin preferencia --</option>
                      <option value="1">Antes de 1 semana</option>
                      <option value="2">Entre 1 y 2 semanas</option>
                      <option value="3">Más de 2 semanas</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label htmlFor="descripcion" className="form-label">
                      Descripción del proyecto *
                    </label>
                    <textarea
                      id="descripcion"
                      name="descripcion"
                      rows={5}
                      className={`form-control${errores.descripcion ? ' is-invalid' : ''}`}
                      value={formulario.descripcion}
                      onChange={actualizar}
                      maxLength={2000}
                      placeholder="Cuéntanos las medidas, colores, cantidad exacta y cualquier detalle especial (mínimo 10 caracteres)..."
                      required
                    />
                    {errores.descripcion ? (
                      <div className="invalid-feedback">{errores.descripcion}</div>
                    ) : (
                      <div className="form-text">{formulario.descripcion.length}/2000 caracteres</div>
                    )}
                  </div>
                  <div className="col-12">
                    <label htmlFor="archivos" className="form-label">
                      Archivos 3D (opcional)
                    </label>
                    <input
                      ref={archivoInputRef}
                      id="archivos"
                      name="archivos"
                      type="file"
                      className={`form-control${errorArchivos ? ' is-invalid' : ''}`}
                      accept=".stl,.STL,.obj,.OBJ"
                      multiple
                      onChange={agregarArchivos}
                    />
                    <div className="form-text">
                      Hasta {MAX_ARCHIVOS} archivos .STL o .OBJ, máximo 50 MB por archivo.
                    </div>
                    {Boolean(errorArchivos) && <div className="invalid-feedback d-block">{errorArchivos}</div>}
                    {archivos.length > 0 && (
                      <ul className="list-group mt-3">
                        {archivos.map((archivo, indice) => (
                          <li
                            key={`${archivo.name}-${archivo.size}-${indice}`}
                            className="list-group-item d-flex justify-content-between align-items-center"
                          >
                            <span>
                              <i className="bi bi-file-earmark me-2 texto-marca" aria-hidden="true" />
                              {archivo.name}{' '}
                              <span className="small texto-gris">({tamanoLegible(archivo.size)})</span>
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger rounded-circle"
                              aria-label={`Quitar ${archivo.name}`}
                              onClick={() => quitarArchivo(indice)}
                            >
                              <i className="bi bi-x-lg" aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-3 mt-4">
                  <button type="submit" className="btn btn-acento btn-lg rounded-pill px-4" disabled={enviando}>
                    {enviando ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                        Enviando...
                      </>
                    ) : (
                      'Solicitar cotización'
                    )}
                  </button>
                  <button
                    type="reset"
                    className="btn btn-marca-outline btn-lg rounded-pill px-4"
                    onClick={() => {
                      setFormulario(formularioInicial)
                      setArchivos([])
                      setErrores({})
                      setErrorArchivos(null)
                      setError(null)
                    }}
                  >
                    Limpiar formulario
                  </button>
                </div>
              </form>
            </div>
            <div className="col-lg-4">
              <div className="card card-formulario p-4 h-100">
                <h2 className="h5 fw-bold">¿Cómo funciona?</h2>
                <ol className="ps-3 small">
                  <li className="mb-2">Completas el formulario con los detalles de tu idea.</li>
                  <li className="mb-2">Revisamos medidas, materiales y cantidad.</li>
                  <li className="mb-2">Recibes un presupuesto con monto y plazo de entrega.</li>
                  <li>Confirmas y coordinamos la producción.</li>
                </ol>
                <hr />
                <h2 className="h6 fw-bold">Archivos 3D</h2>
                <p className="small texto-gris mb-2">
                  Si tienes un modelo, adjúntalo en formato <strong>.STL</strong> o{' '}
                  <strong>.OBJ</strong>. También podemos diseñar desde cero.
                </p>
                <p className="small texto-gris mb-0">
                  <i className="bi bi-envelope me-1" aria-hidden="true" />
                  contacto@bioforjarc.cl
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
