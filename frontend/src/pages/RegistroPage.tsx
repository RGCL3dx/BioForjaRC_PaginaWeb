import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

interface FormularioRegistro {
  nombre: string
  apellido: string
  rut: string
  correo: string
  telefono: string
  clave: string
  confirmarClave: string
  aceptaTerminos: boolean
}

const formularioInicial: FormularioRegistro = {
  nombre: '',
  apellido: '',
  rut: '',
  correo: '',
  telefono: '',
  clave: '',
  confirmarClave: '',
  aceptaTerminos: false,
}

export function RegistroPage() {
  const { usuario, registrar } = useAuth()
  const { mostrar } = useNotification()
  const navigate = useNavigate()
  const [formulario, setFormulario] = useState<FormularioRegistro>(formularioInicial)
  const [error, setError] = useState<unknown>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  if (usuario) return <Navigate to="/mi-cuenta" replace />

  const actualizar = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = event.target
    setFormulario((actual) => ({
      ...actual,
      [name]: type === 'checkbox' ? event.target.checked : value,
    }))
  }

  const validar = (): boolean => {
    const nuevos: Record<string, string> = {}
    if (!formulario.nombre.trim()) nuevos.nombre = 'El nombre es obligatorio'
    if (!formulario.apellido.trim()) nuevos.apellido = 'El apellido es obligatorio'
    if (!/^\d{1,2}\.?\d{3}\.?\d{3}-[\dKk]$/.test(formulario.rut.trim())) {
      nuevos.rut = 'Usa el formato 12.345.678-9'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo.trim())) {
      nuevos.correo = 'Ingresa un correo válido'
    }
    if (formulario.telefono && !/^[+0-9 ()-]{6,25}$/.test(formulario.telefono.trim())) {
      nuevos.telefono = 'El teléfono contiene caracteres no permitidos'
    }
    if (formulario.clave.length < 8) {
      nuevos.clave = 'La contraseña debe tener al menos 8 caracteres'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formulario.clave)) {
      nuevos.clave = 'Debe incluir mayúscula, minúscula y número'
    }
    if (formulario.clave !== formulario.confirmarClave) {
      nuevos.confirmarClave = 'Las contraseñas no coinciden'
    }
    if (!formulario.aceptaTerminos) {
      nuevos.aceptaTerminos = 'Debes aceptar los términos para registrarte'
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
      const nuevo = await registrar({
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        rut: formulario.rut.trim(),
        correo: formulario.correo.trim(),
        telefono: formulario.telefono.trim() || undefined,
        clave: formulario.clave,
      })
      mostrar(`Cuenta creada. ¡Bienvenido(a), ${nuevo.nombre}!`, 'success')
      navigate('/mi-cuenta', { replace: true })
    } catch (err: unknown) {
      setError(err)
    } finally {
      setEnviando(false)
    }
  }

  const campoClase = (campo: string) =>
    `form-control${errores[campo] ? ' is-invalid' : ''}`

  return (
    <section className="py-5 seccion-clara">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-9 col-lg-7 col-xl-6">
            <h1 className="titulo-seccion">Crear cuenta</h1>
            <p className="pagina-intro text-center">
              Regístrate para comprar, revisar tu historial y gestionar tus direcciones.
            </p>

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
                  <label htmlFor="rut" className="form-label">
                    RUT *
                  </label>
                  <input
                    id="rut"
                    name="rut"
                    className={campoClase('rut')}
                    value={formulario.rut}
                    onChange={actualizar}
                    placeholder="12.345.678-9"
                    maxLength={20}
                    required
                  />
                  {errores.rut && <div className="invalid-feedback">{errores.rut}</div>}
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
                    maxLength={25}
                  />
                  {errores.telefono && <div className="invalid-feedback">{errores.telefono}</div>}
                </div>
                <div className="col-12">
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
                  <label htmlFor="clave" className="form-label">
                    Contraseña *
                  </label>
                  <input
                    id="clave"
                    name="clave"
                    type="password"
                    className={campoClase('clave')}
                    value={formulario.clave}
                    onChange={actualizar}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                  />
                  {errores.clave ? (
                    <div className="invalid-feedback">{errores.clave}</div>
                  ) : (
                    <div className="form-text">Mínimo 8 caracteres, con mayúscula, minúscula y número.</div>
                  )}
                </div>
                <div className="col-md-6">
                  <label htmlFor="confirmarClave" className="form-label">
                    Confirmar contraseña *
                  </label>
                  <input
                    id="confirmarClave"
                    name="confirmarClave"
                    type="password"
                    className={campoClase('confirmarClave')}
                    value={formulario.confirmarClave}
                    onChange={actualizar}
                    autoComplete="new-password"
                    required
                  />
                  {errores.confirmarClave && (
                    <div className="invalid-feedback">{errores.confirmarClave}</div>
                  )}
                </div>
              </div>

              <div className="form-check mt-4">
                <input
                  className={`form-check-input${errores.aceptaTerminos ? ' is-invalid' : ''}`}
                  type="checkbox"
                  id="aceptaTerminos"
                  name="aceptaTerminos"
                  checked={formulario.aceptaTerminos}
                  onChange={actualizar}
                />
                <label className="form-check-label" htmlFor="aceptaTerminos">
                  Acepto los términos y el tratamiento de mis datos para gestionar compras y envíos. *
                </label>
                {errores.aceptaTerminos && (
                  <div className="invalid-feedback d-block">{errores.aceptaTerminos}</div>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-acento btn-lg rounded-pill w-100 mt-4"
                disabled={enviando}
              >
                {enviando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                    Creando cuenta...
                  </>
                ) : (
                  'Crear mi cuenta'
                )}
              </button>

              <p className="text-center mt-4 mb-0">
                ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
