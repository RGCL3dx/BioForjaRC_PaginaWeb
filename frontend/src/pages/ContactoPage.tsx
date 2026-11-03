import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send, Share2 } from 'lucide-react'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Spinner } from '../components/ui/spinner'
import { Textarea } from '../components/ui/textarea'
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

  const actualizar = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

  const mensajeCampo = (campo: string) =>
    errores[campo] ? <p className="field-error">{errores[campo]}</p> : null

  return (
    <>
      <section className="pt-10 pb-6">
        <div className="container-page text-center">
          <h1 className="section-title">Contacto</h1>
          <p className="page-intro mb-0">Escríbenos y te responderemos a la brevedad.</p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            {confirmacion && (
              <Alert variant="success" className="mb-4">
                <CheckCircle2 aria-hidden="true" />
                <AlertTitle>Mensaje enviado</AlertTitle>
                <AlertDescription>
                  <p>
                    {confirmacion.mensajeConfirmacion ||
                      'Tu consulta fue registrada. Te responderemos a la brevedad.'}
                  </p>
                  <p className="text-xs opacity-80">
                    Referencia #{confirmacion.id} · {confirmacion.asunto}
                  </p>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={enviar} noValidate>
              <Card className="gap-4 p-6 sm:p-8">
                {Boolean(error) && <ErrorAlert error={error} onClose={() => setError(null)} />}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="nombre">Nombre completo *</Label>
                    <Input
                      type="text"
                      id="nombre"
                      name="nombre"
                      placeholder="Ej: Juan Pérez"
                      autoComplete="name"
                      value={formulario.nombre}
                      onChange={actualizar}
                      maxLength={100}
                      required
                      aria-invalid={errores.nombre ? true : undefined}
                    />
                    {mensajeCampo('nombre')}
                  </div>
                  <div>
                    <Label htmlFor="correo">Correo electrónico *</Label>
                    <Input
                      type="email"
                      id="correo"
                      name="correo"
                      placeholder="ej: nombre@correo.cl"
                      autoComplete="email"
                      value={formulario.correo}
                      onChange={actualizar}
                      maxLength={150}
                      required
                      aria-invalid={errores.correo ? true : undefined}
                    />
                    {mensajeCampo('correo')}
                  </div>
                  <div>
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      placeholder="+56 9 1234 5678"
                      autoComplete="tel"
                      value={formulario.telefono}
                      onChange={actualizar}
                      maxLength={30}
                      aria-invalid={errores.telefono ? true : undefined}
                    />
                    {mensajeCampo('telefono')}
                  </div>
                  <div>
                    <Label htmlFor="asunto">Asunto *</Label>
                    <Input
                      type="text"
                      id="asunto"
                      name="asunto"
                      placeholder="Ej: Consulta por maceteros"
                      value={formulario.asunto}
                      onChange={actualizar}
                      maxLength={120}
                      required
                      aria-invalid={errores.asunto ? true : undefined}
                    />
                    {mensajeCampo('asunto')}
                  </div>
                </div>

                <div>
                  <Label htmlFor="mensaje">Mensaje *</Label>
                  <Textarea
                    id="mensaje"
                    name="mensaje"
                    rows={5}
                    placeholder="Cuéntanos en qué te podemos ayudar (mínimo 10 caracteres)..."
                    value={formulario.mensaje}
                    onChange={actualizar}
                    maxLength={2000}
                    required
                    aria-invalid={errores.mensaje ? true : undefined}
                  />
                  {errores.mensaje ? (
                    mensajeCampo('mensaje')
                  ) : (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {formulario.mensaje.length}/2000 caracteres
                    </p>
                  )}
                </div>

                <Button type="submit" size="lg" variant="accent" disabled={enviando}>
                  {enviando ? (
                    <>
                      <Spinner className="size-4" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" aria-hidden="true" />
                      Enviar mensaje
                    </>
                  )}
                </Button>
              </Card>
            </form>
          </div>

          <Card className="h-fit gap-5 p-6">
            <h2 className="text-lg font-bold">¿Prefieres escribirnos directo?</h2>

            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                Santiago, Chile
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-primary" aria-hidden="true" />
                <a href="tel:+56912345678" className="hover:text-primary hover:underline">
                  +56 9 1234 5678
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-primary" aria-hidden="true" />
                <a href="mailto:contacto@bioforjarc.cl" className="hover:text-primary hover:underline">
                  contacto@bioforjarc.cl
                </a>
              </li>
            </ul>

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-display text-xs font-bold tracking-wide text-muted-foreground uppercase">
                <Clock className="size-4" aria-hidden="true" />
                Horario de atención
              </h3>
              <p className="text-sm">Lunes a viernes: 09:00 – 18:00 hrs</p>
              <p className="text-sm">Sábado: 10:00 – 14:00 hrs</p>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 font-display text-xs font-bold tracking-wide text-muted-foreground uppercase">
                <Share2 className="size-4" aria-hidden="true" />
                Síguenos
              </h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { href: 'https://facebook.com', label: 'Facebook' },
                  { href: 'https://instagram.com', label: 'Instagram' },
                  { href: 'https://x.com', label: 'X (Twitter)' },
                ].map((red) => (
                  <a
                    key={red.label}
                    href={red.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-brand/30 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    {red.label}
                  </a>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  )
}
