import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, FileText, Info, Mail, Paperclip, Send, X } from 'lucide-react'
import { ErrorAlert } from '../components/common/ErrorAlert'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Spinner } from '../components/ui/spinner'
import { Textarea } from '../components/ui/textarea'
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
const selectClase =
  'flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-xs outline-none transition-colors focus-visible:border-brand-light focus-visible:ring-2 focus-visible:ring-ring/30 aria-invalid:border-destructive'

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

  const mensajeCampo = (campo: string) =>
    errores[campo] ? <p className="field-error">{errores[campo]}</p> : null

  if (resultado) {
    return (
      <section className="bg-white/40 py-14">
        <div className="container-page max-w-3xl">
          <Card className="items-center gap-3 p-6 text-center sm:p-10">
            <CheckCircle2 className="size-14 text-emerald-600" aria-hidden="true" />
            <h1 className="text-2xl font-extrabold text-brand-dark">Solicitud recibida</h1>
            <p className="text-muted-foreground">
              Gracias, {resultado.nombre}. Tu solicitud de cotización fue registrada con el ticket:
            </p>
            <p className="font-mono text-2xl font-bold text-primary">{resultado.numeroTicket}</p>
            <p className="max-w-xl text-muted-foreground">
              Te contactaremos a <strong className="text-foreground">{resultado.correo}</strong> con
              el presupuesto y los próximos pasos. También puedes responder al correo de
              confirmación.
            </p>
            {resultado.archivos.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Adjuntaste {resultado.archivos.length} archivo
                {resultado.archivos.length === 1 ? '' : 's'} 3D.
              </p>
            )}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Button type="button" onClick={() => setResultado(null)}>
                Enviar otra cotización
              </Button>
              <Button asChild variant="outline">
                <Link to="/productos">Ver productos</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="pt-10 pb-6">
        <div className="container-page text-center">
          <h1 className="section-title">Cotización personalizada</h1>
          <p className="page-intro mb-0">
            Cuéntanos qué necesitas y te enviaremos una cotización a la medida de tu proyecto.
          </p>
        </div>
      </section>

      <section className="pb-16">
        <div className="container-page">
          {producto && (
            <Alert variant="info" className="mx-auto mb-5 max-w-3xl">
              <Info aria-hidden="true" />
              <AlertDescription>
                Estás cotizando: <strong>{producto}</strong>. Puedes ajustar la descripción.
              </AlertDescription>
            </Alert>
          )}
          <div className="grid justify-center gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <form onSubmit={enviar} noValidate>
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
                      aria-invalid={errores.nombre ? true : undefined}
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
                      aria-invalid={errores.apellido ? true : undefined}
                    />
                    {mensajeCampo('apellido')}
                  </div>
                  <div>
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
                      aria-invalid={errores.correo ? true : undefined}
                    />
                    {mensajeCampo('correo')}
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
                      maxLength={30}
                      aria-invalid={errores.telefono ? true : undefined}
                    />
                    {mensajeCampo('telefono')}
                  </div>
                  <div>
                    <Label htmlFor="categoria">Categoría *</Label>
                    <select
                      id="categoria"
                      name="categoria"
                      className={selectClase}
                      value={formulario.categoria}
                      onChange={actualizar}
                      required
                      aria-invalid={errores.categoria ? true : undefined}
                    >
                      <option value="">-- Selecciona --</option>
                      <option value="maceteros">Maceteros</option>
                      <option value="articulados">Animales articulados</option>
                      <option value="sensorial">Juguetes sensoriales</option>
                      <option value="figuras">Figuras ecológicas</option>
                      <option value="otro">Otro</option>
                    </select>
                    {mensajeCampo('categoria')}
                  </div>
                  <div>
                    <Label htmlFor="cantidad">Cantidad estimada</Label>
                    <Input
                      id="cantidad"
                      name="cantidad"
                      type="number"
                      min={1}
                      value={formulario.cantidad}
                      onChange={actualizar}
                      placeholder="Ej: 20"
                      aria-invalid={errores.cantidad ? true : undefined}
                    />
                    {mensajeCampo('cantidad')}
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="plazo">Plazo deseado</Label>
                    <select
                      id="plazo"
                      name="plazo"
                      className={selectClase}
                      value={formulario.plazo}
                      onChange={actualizar}
                    >
                      <option value="">-- Sin preferencia --</option>
                      <option value="1">Antes de 1 semana</option>
                      <option value="2">Entre 1 y 2 semanas</option>
                      <option value="3">Más de 2 semanas</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="descripcion">Descripción del proyecto *</Label>
                    <Textarea
                      id="descripcion"
                      name="descripcion"
                      rows={5}
                      value={formulario.descripcion}
                      onChange={actualizar}
                      maxLength={2000}
                      placeholder="Cuéntanos las medidas, colores, cantidad exacta y cualquier detalle especial (mínimo 10 caracteres)..."
                      required
                      aria-invalid={errores.descripcion ? true : undefined}
                    />
                    {errores.descripcion ? (
                      mensajeCampo('descripcion')
                    ) : (
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {formulario.descripcion.length}/2000 caracteres
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="archivos">Archivos 3D (opcional)</Label>
                    <input
                      ref={archivoInputRef}
                      id="archivos"
                      name="archivos"
                      type="file"
                      className="flex w-full cursor-pointer rounded-lg border border-input bg-white text-sm file:mr-4 file:cursor-pointer file:rounded-l-lg file:border-0 file:bg-secondary file:px-4 file:py-2.5 file:font-semibold file:text-secondary-foreground hover:file:bg-brand/10"
                      accept=".stl,.STL,.obj,.OBJ"
                      multiple
                      onChange={agregarArchivos}
                      aria-invalid={errorArchivos ? true : undefined}
                    />
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Paperclip className="size-3.5" aria-hidden="true" />
                      Hasta {MAX_ARCHIVOS} archivos .STL o .OBJ, máximo 50 MB por archivo.
                    </p>
                    {Boolean(errorArchivos) && <p className="field-error">{errorArchivos}</p>}
                    {archivos.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {archivos.map((archivo, indice) => (
                          <li
                            key={`${archivo.name}-${archivo.size}-${indice}`}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm"
                          >
                            <span className="flex items-center gap-2 truncate">
                              <FileText className="size-4 shrink-0 text-primary" aria-hidden="true" />
                              <span className="truncate">{archivo.name}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                ({tamanoLegible(archivo.size)})
                              </span>
                            </span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-7 shrink-0 rounded-full text-destructive hover:bg-destructive hover:text-white"
                              aria-label={`Quitar ${archivo.name}`}
                              onClick={() => quitarArchivo(indice)}
                            >
                              <X className="size-3.5" aria-hidden="true" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" size="lg" variant="accent" disabled={enviando}>
                    {enviando ? (
                      <>
                        <Spinner className="size-4" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" aria-hidden="true" />
                        Solicitar cotización
                      </>
                    )}
                  </Button>
                  <Button
                    type="reset"
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setFormulario(formularioInicial)
                      setArchivos([])
                      setErrores({})
                      setErrorArchivos(null)
                      setError(null)
                    }}
                  >
                    Limpiar formulario
                  </Button>
                </div>
              </Card>
            </form>

            <aside>
              <Card className="h-full gap-4 p-6">
                <h2 className="text-lg font-bold">¿Cómo funciona?</h2>
                <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                  <li>Completas el formulario con los detalles de tu idea.</li>
                  <li>Revisamos medidas, materiales y cantidad.</li>
                  <li>Recibes un presupuesto con monto y plazo de entrega.</li>
                  <li>Confirmas y coordinamos la producción.</li>
                </ol>
                <hr className="border-border" />
                <h2 className="font-display text-sm font-bold">Archivos 3D</h2>
                <p className="text-sm text-muted-foreground">
                  Si tienes un modelo, adjúntalo en formato <strong>.STL</strong> o{' '}
                  <strong>.OBJ</strong>. También podemos diseñar desde cero.
                </p>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="size-4" aria-hidden="true" />
                  contacto@bioforjarc.cl
                </p>
              </Card>
            </aside>
          </div>
        </div>
      </section>
    </>
  )
}
