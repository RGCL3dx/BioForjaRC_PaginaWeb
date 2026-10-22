import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { consultaService } from '../services/consultas'
import type { ConsultaResponse } from '../types/api'

interface FormularioContacto {
  nombre: string
  correo: string
  telefono: string
  asunto: string
  mensaje: string
}

const formularioInicial: FormularioContacto = {
  nombre: '',
  correo: '',
  telefono: '',
  asunto: '',
  mensaje: '',
}

export function ContactoPage() {
  const [formulario, setFormulario] = useState<FormularioContacto>(formularioInicial)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [error, setError] = useState<unknown>(null)
  const [enviando, setEnviando] = useState(false)
  const [confirmacion, setConfirmacion] = useState<ConsultaResponse | null>(null)

  const actualizar = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target
    setFormulario((actual) => ({ ...actual, [name]: value }))
  }

  const validar = (): boolean => {
    const nuevos: Record<string, string> = {}
    if (formulario.nombre.trim().length < 3) {
      nuevos.nombre = 'El nombre debe tener al menos 3 caracteres'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo.trim())) {
      nuevos.correo = 'Ingresa un correo válido'
    }
    if (formulario.telefono && !/^\+?[0-9\s-]{8,20}$/.test(formulario.telefono.trim())) {
      nuevos.telefono = 'El teléfono no tiene un formato válido'
    }
    if (formulario.asunto.trim().length < 4) {
      nuevos.asunto = 'El asunto debe tener al menos 4 caracteres'
    }
    if (formulario.mensaje.trim().length < 10) {
      nuevos.mensaje = 'El mensaje debe tener al menos 10 caracteres'
    }
    setErrores(nuevos)
    return Object.keys(nuevos).length === 0
  }

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!validar()) return
    setEnviando(true)
    try {
      const respuesta = await consultaService.crear({
        nombre: formulario.nombre.trim(),
        correo: formulario.correo.trim(),
        telefono: formulario.telefono.trim() || undefined,
        asunto: formulario.asunto.trim(),
        mensaje: formulario.mensaje.trim(),
      })
      setConfirmacion(respuesta)
      setFormulario(formularioInicial)
      setErrores({})
    } catch (err: unknown) {
      setError(err)
    } finally {
      setEnviando(false)
    }
  }

  const campoClase = (campo: string) => `form-control${errores[campo] ? ' is-invalid' : ''}`

  return (
    <>
      <section className="py-5">
        <div className="container">
          <h1 className="titulo-seccion">Contacto</h1>
          <p className="pagina-intro">Escríbenos y te responderemos a la brevedad.</p>
        </div>
      </section>

      <section className="py-4 seccion-clara">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-7">
              {confirmacion && (
                <div className="alert alert-success" role="status">
                  <h2 className="h6 alert-heading">
                    <i className="bi bi-check-circle me-2" aria-hidden="true" />
                    Mensaje enviado
                  </h2>
                  <p className="mb-1">
                    {confirmacion.mensajeConfirmacion ||
                      'Tu consulta fue registrada. Te responderemos a la brevedad.'}
                  </p>
                  <p className="small mb-0">
                    Referencia #{confirmacion.id} · {confirmacion.asunto}
                  </p>
                </div>
              )}

              <form className="card card-formulario p-4 p-md-5" onSubmit={enviar} noValidate>
                {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}

                <div className="mb-3">
                  <label htmlFor="nombre" className="form-label">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    className={campoClase('nombre')}
                    id="nombre"
                    name="nombre"
                    placeholder="Ej: Juan Pérez"
                    autoComplete="name"
                    value={formulario.nombre}
                    onChange={actualizar}
                    maxLength={100}
                    required
                  />
                  {errores.nombre && <div className="invalid-feedback">{errores.nombre}</div>}
                </div>

                <div className="mb-3">
                  <label htmlFor="correo" className="form-label">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    className={campoClase('correo')}
                    id="correo"
                    name="correo"
                    placeholder="ej: nombre@correo.cl"
                    autoComplete="email"
                    value={formulario.correo}
                    onChange={actualizar}
                    maxLength={150}
                    required
                  />
                  {errores.correo && <div className="invalid-feedback">{errores.correo}</div>}
                </div>

                <div className="mb-3">
                  <label htmlFor="telefono" className="form-label">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    className={campoClase('telefono')}
                    id="telefono"
                    name="telefono"
                    placeholder="+56 9 1234 5678"
                    autoComplete="tel"
                    value={formulario.telefono}
                    onChange={actualizar}
                    maxLength={30}
                  />
                  {errores.telefono && <div className="invalid-feedback">{errores.telefono}</div>}
                </div>

                <div className="mb-3">
                  <label htmlFor="asunto" className="form-label">
                    Asunto *
                  </label>
                  <input
                    type="text"
                    className={campoClase('asunto')}
                    id="asunto"
                    name="asunto"
                    placeholder="Ej: Consulta por maceteros"
                    value={formulario.asunto}
                    onChange={actualizar}
                    maxLength={120}
                    required
                  />
                  {errores.asunto && <div className="invalid-feedback">{errores.asunto}</div>}
                </div>

                <div className="mb-4">
                  <label htmlFor="mensaje" className="form-label">
                    Mensaje *
                  </label>
                  <textarea
                    className={campoClase('mensaje')}
                    id="mensaje"
                    name="mensaje"
                    rows={5}
                    placeholder="Cuéntanos en qué te podemos ayudar (mínimo 10 caracteres)..."
                    value={formulario.mensaje}
                    onChange={actualizar}
                    maxLength={2000}
                    required
                  />
                  {errores.mensaje ? (
                    <div className="invalid-feedback">{errores.mensaje}</div>
                  ) : (
                    <div className="form-text">{formulario.mensaje.length}/2000 caracteres</div>
                  )}
                </div>

                <button type="submit" className="btn btn-acento btn-lg rounded-pill px-4" disabled={enviando}>
                  {enviando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar mensaje'
                  )}
                </button>
              </form>
            </div>

            <div className="col-lg-5">
              <div className="card card-formulario p-4 h-100">
                <h2 className="h5 fw-bold mb-3">¿Prefieres escribirnos directo?</h2>

                <p className="mb-2">
                  <i className="bi bi-geo-alt-fill me-2 pie-icono text-marca" aria-hidden="true" />
                  Santiago, Chile
                </p>
                <p className="mb-2">
                  <i className="bi bi-telephone-fill me-2 pie-icono text-marca" aria-hidden="true" />
                  <a href="tel:+56912345678" className="enlace-marca">
                    +56 9 1234 5678
                  </a>
                </p>
                <p className="mb-4">
                  <i className="bi bi-envelope-fill me-2 pie-icono text-marca" aria-hidden="true" />
                  <a href="mailto:contacto@bioforjarc.cl" className="enlace-marca">
                    contacto@bioforjarc.cl
                  </a>
                </p>

                <h3 className="h6 text-uppercase fw-bold texto-gris mb-3">Horario de atención</h3>
                <p className="mb-1">Lunes a viernes: 09:00 – 18:00 hrs</p>
                <p className="mb-4">Sábado: 10:00 – 14:00 hrs</p>

                <h3 className="h6 text-uppercase fw-bold texto-gris mb-3">Síguenos</h3>
                <div className="d-flex gap-3 fs-3">
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-marca" aria-label="Facebook">
                    <i className="bi bi-facebook" aria-hidden="true" />
                  </a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="text-marca" aria-label="Instagram">
                    <i className="bi bi-instagram" aria-hidden="true" />
                  </a>
                  <a href="https://x.com" target="_blank" rel="noreferrer" className="text-marca" aria-label="X (Twitter)">
                    <i className="bi bi-twitter-x" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
