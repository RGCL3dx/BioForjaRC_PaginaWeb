import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Spinner } from '../components/ui/spinner'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { cn } from '@/lib/utils'

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

  const errorCampo = (campo: string) => Boolean(errores[campo])
  const mensajeCampo = (campo: string) =>
    errores[campo] ? <p className="field-error">{errores[campo]}</p> : null

  return (
    <section className="bg-white/40 py-14">
      <div className="container-page flex flex-col items-center">
        <h1 className="section-title">Crear cuenta</h1>
        <p className="page-intro max-w-xl text-center">
          Regístrate para comprar, revisar tu historial y gestionar tus direcciones.
        </p>

        <form className="w-full max-w-2xl" onSubmit={enviar} noValidate>
          <Card className="gap-5 p-6 sm:p-8">
            {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={actualizar}
                  autoComplete="given-name"
                  maxLength={80}
                  required
                  aria-invalid={errorCampo('nombre')}
                />
                {mensajeCampo('nombre')}
              </div>
              <div>
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  name="apellido"
                  value={formulario.apellido}
                  onChange={actualizar}
                  autoComplete="family-name"
                  maxLength={80}
                  required
                  aria-invalid={errorCampo('apellido')}
                />
                {mensajeCampo('apellido')}
              </div>
              <div>
                <Label htmlFor="rut">RUT *</Label>
                <Input
                  id="rut"
                  name="rut"
                  value={formulario.rut}
                  onChange={actualizar}
                  placeholder="12.345.678-9"
                  maxLength={20}
                  required
                  aria-invalid={errorCampo('rut')}
                />
                {mensajeCampo('rut')}
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  value={formulario.telefono}
                  onChange={actualizar}
                  autoComplete="tel"
                  maxLength={25}
                  aria-invalid={errorCampo('telefono')}
                />
                {mensajeCampo('telefono')}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="correo">Correo electrónico *</Label>
                <Input
                  id="correo"
                  name="correo"
                  type="email"
                  value={formulario.correo}
                  onChange={actualizar}
                  autoComplete="email"
                  maxLength={150}
                  required
                  aria-invalid={errorCampo('correo')}
                />
                {mensajeCampo('correo')}
              </div>
              <div>
                <Label htmlFor="clave">Contraseña *</Label>
                <Input
                  id="clave"
                  name="clave"
                  type="password"
                  value={formulario.clave}
                  onChange={actualizar}
                  autoComplete="new-password"
                  minLength={8}
                  maxLength={72}
                  required
                  aria-invalid={errorCampo('clave')}
                />
                {errores.clave ? (
                  mensajeCampo('clave')
                ) : (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Mínimo 8 caracteres, con mayúscula, minúscula y número.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="confirmarClave">Confirmar contraseña *</Label>
                <Input
                  id="confirmarClave"
                  name="confirmarClave"
                  type="password"
                  value={formulario.confirmarClave}
                  onChange={actualizar}
                  autoComplete="new-password"
                  required
                  aria-invalid={errorCampo('confirmarClave')}
                />
                {mensajeCampo('confirmarClave')}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  id="aceptaTerminos"
                  name="aceptaTerminos"
                  checked={formulario.aceptaTerminos}
                  onChange={actualizar}
                  className={cn(
                    'mt-0.5 size-4 rounded border-input accent-primary',
                    errores.aceptaTerminos && 'outline-2 outline-destructive',
                  )}
                  aria-invalid={errorCampo('aceptaTerminos')}
                />
                <span>
                  Acepto los términos y el tratamiento de mis datos para gestionar compras y envíos. *
                </span>
              </label>
              {errores.aceptaTerminos && (
                <p className="field-error">{errores.aceptaTerminos}</p>
              )}
            </div>

            <Button type="submit" size="lg" variant="accent" className="w-full" disabled={enviando}>
              {enviando ? (
                <>
                  <Spinner className="size-4" />
                  Creando cuenta...
                </>
              ) : (
                'Crear mi cuenta'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </Card>
        </form>
      </div>
    </section>
  )
}
