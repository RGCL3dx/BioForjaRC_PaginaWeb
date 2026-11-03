import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { Alert } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Spinner } from '../components/ui/spinner'
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
    <section className="bg-white/40 py-14">
      <div className="container-page flex flex-col items-center">
        <h1 className="section-title">Iniciar sesión</h1>
        <p className="page-intro max-w-md text-center">
          Accede para revisar tus pedidos y completar tus compras.
        </p>

        <form onSubmit={enviar} className="w-full max-w-md">
          <Card className="gap-4 p-6 sm:p-8">
            {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}

            <div>
              <Label htmlFor="correo">Correo electrónico *</Label>
              <Input
                type="email"
                id="correo"
                name="correo"
                placeholder="ej: nombre@correo.cl"
                autoComplete="email"
                value={correo}
                onChange={(event) => setCorreo(event.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="clave">Contraseña *</Label>
              <div className="relative">
                <Input
                  type={mostrarClave ? 'text' : 'password'}
                  id="clave"
                  name="clave"
                  autoComplete="current-password"
                  value={clave}
                  onChange={(event) => setClave(event.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-1 -translate-y-1/2 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={() => setMostrarClave((visible) => !visible)}
                  aria-label={mostrarClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {mostrarClave ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" size="lg" variant="accent" className="mt-1 w-full" disabled={enviando}>
              {enviando ? (
                <>
                  <Spinner className="size-4" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link to="/registro" className="font-semibold text-primary hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </Card>

          <Alert variant="brand" className="mt-4 text-xs">
            <ShieldCheck aria-hidden="true" />
            Tus datos se envían al API Gateway local de BioForjaRC. No compartas tu contraseña.
          </Alert>
        </form>
      </div>
    </section>
  )
}
