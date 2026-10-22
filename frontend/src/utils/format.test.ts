import { describe, expect, it } from 'vitest'
import {
  assetUrl,
  estadoCotizacionClass,
  estadoPedidoClass,
  estadoUsuarioClass,
  formatDate,
  hoyISO,
} from './format'

describe('assetUrl', () => {
  it('normaliza rutas relativas del backend', () => {
    expect(assetUrl('../assets/imagenes/fondo.webp')).toBe('/assets/imagenes/fondo.webp')
    expect(assetUrl('assets/imagenes/macetero-1.webp')).toBe('/assets/imagenes/macetero-1.webp')
    expect(assetUrl('imagenes/sensorial-cubo.jpg')).toBe('/assets/imagenes/sensorial-cubo.jpg')
  })

  it('conserva rutas absolutas y recursos externos', () => {
    expect(assetUrl('/assets/imagenes/LOGO.jpg')).toBe('/assets/imagenes/LOGO.jpg')
    expect(assetUrl('https://cdn.ejemplo.cl/producto.webp')).toBe(
      'https://cdn.ejemplo.cl/producto.webp',
    )
    expect(assetUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc')
  })

  it('usa la imagen por defecto cuando no hay ruta', () => {
    expect(assetUrl(null)).toBe('/assets/imagenes/SINIMAGEN.png')
    expect(assetUrl('')).toBe('/assets/imagenes/SINIMAGEN.png')
  })
})

describe('formatDate', () => {
  it('devuelve un guion cuando no hay fecha', () => {
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate('')).toBe('—')
  })

  it('conserva un texto que no es una fecha válida', () => {
    expect(formatDate('sin-fecha')).toBe('sin-fecha')
  })
})

describe('estados', () => {
  it('clasifica los estados de pedido', () => {
    expect(estadoPedidoClass('Entregado')).toBe('text-bg-success')
    expect(estadoPedidoClass('Despachado')).toBe('text-bg-info')
    expect(estadoPedidoClass('Cancelado')).toBe('text-bg-danger')
    expect(estadoPedidoClass('En preparación')).toBe('text-bg-warning')
  })

  it('clasifica cotizaciones y usuarios', () => {
    expect(estadoCotizacionClass('Presupuestada')).toBe('text-bg-success')
    expect(estadoCotizacionClass('Pendiente')).toBe('text-bg-warning')
    expect(estadoUsuarioClass('Activo')).toBe('text-bg-success')
    expect(estadoUsuarioClass('Inactivo')).toBe('text-bg-secondary')
  })
})

describe('hoyISO', () => {
  it('entrega una fecha en formato ISO corto', () => {
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
