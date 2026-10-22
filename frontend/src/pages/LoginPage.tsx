import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'

export function LoginPage() {
  const { usuario, login, esAdmin } = useAuth()
  const { mostrar } = useNotification()
  const navigate = useNavigate()
  const location = useLocation()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [mostrarClave, setMostrarClave] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [enviando, setEnviando] = useState(false)

  const destino = (() => {
    const desde = (location.state as { from?: string } | null)?.from
    if (desde && desde.startsWith('/')) return desde
    return esAdmin ? '/admin' : '/mi-cuenta'
  })()

  if (usuario) return <Navigate to={destino} replace />

  const enviar = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const autenticado = await login(correo, clave)
      mostrar(`Bienvenido(a), ${autenticado.nombre}`, 'success')
      navigate(
        (location.state as { from?: string } | null)?.from ??
          (autenticado.rol === 'administrador' ? '/admin' : '/mi-cuenta'),
        { replace: true },
      )
    } catch (err: unknown) {
      setError(err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="pt-2">
      <section className="py-5 seccion-clara">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-md-7 col-lg-5">
              <h1 className="titulo-seccion">Iniciar sesión</h1>
              <p className="pagina-intro text-center">
                Accede para revisar tus pedidos y completar tus compras.
              </p>

              <form className="card card-formulario p-4 p-md-5" onSubmit={enviar}>
                {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}

                <div className="mb-3">
                  <label className="form-label" htmlFor="correo">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="correo"
                    name="correo"
                    placeholder="ej: nombre@correo.cl"
                    autoComplete="email"
                    value={correo}
                    onChange={(event) => setCorreo(event.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="clave">
                    Contraseña *
                  </label>
                  <div className="input-group">
                    <input
                      type={mostrarClave ? 'text' : 'password'}
                      className="form-control"
                      id="clave"
                      name="clave"
                      autoComplete="current-password"
                      value={clave}
                      onChange={(event) => setClave(event.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setMostrarClave((visible) => !visible)}
                      aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <i className={`bi ${mostrarClave ? 'bi-eye-slash' : 'bi-eye'}`} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-acento btn-lg rounded-pill w-100 mt-2"
                  disabled={enviando}
                >
                  {enviando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                      Ingresando...
                    </>
                  ) : (
                    'Ingresar'
                  )}
                </button>

                <p className="text-center mt-4 mb-0">
                  ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
                </p>
              </form>

              <div className="alert alert-light border mt-4 small">
                <i className="bi bi-shield-lock me-2 texto-marca" aria-hidden="true" />
                Tus datos se envían al API Gateway local de BioForjaRC. No compartas tu contraseña.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
