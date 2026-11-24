import { describe, expect, it } from 'vitest'
import { assetUrl, formatCLP, formatDate, formatDateTime, formatNumber, hoyISO } from './format'

describe('formatCLP', () => {
  it('formatea montos en pesos chilenos sin decimales', () => {
    expect(formatCLP(7990)).toBe('$7.990')
    expect(formatCLP(0)).toBe('$0')
  })

  it('trata valores nulos como cero', () => {
    expect(formatCLP(null)).toBe('$0')
    expect(formatCLP(undefined)).toBe('$0')
  })
})

describe('formatNumber', () => {
  it('usa separadores de miles de es-CL', () => {
    expect(formatNumber(1234567)).toBe('1.234.567')
    expect(formatNumber(null)).toBe('0')
  })
})

describe('formatDate', () => {
  it('convierte una fecha ISO sin zona horaria', () => {
    expect(formatDate('2026-10-22')).toBe('22-10-2026')
  })

  it('devuelve un guion cuando no hay valor', () => {
    expect(formatDate('')).toBe('—')
    expect(formatDate(null)).toBe('—')
  })

  it('conserva el texto original si la fecha es inválida', () => {
    expect(formatDate('no-es-fecha')).toBe('no-es-fecha')
  })
})

describe('formatDateTime', () => {
  it('incluye fecha y hora', () => {
    expect(formatDateTime('2026-10-22T15:30:00')).toMatch(/22-10-2026, .*30/)
  })

  it('devuelve un guion cuando no hay valor', () => {
    expect(formatDateTime(undefined)).toBe('—')
  })
})

describe('assetUrl', () => {
  it('usa la imagen por defecto cuando no hay ruta', () => {
    expect(assetUrl(null)).toBe('/assets/imagenes/SINIMAGEN.png')
  })

  it('respeta rutas absolutas y URLs externas', () => {
    expect(assetUrl('https://cdn.bioforjarc.cl/producto.webp')).toBe(
      'https://cdn.bioforjarc.cl/producto.webp',
    )
    expect(assetUrl('/assets/imagenes/macetero.webp')).toBe('/assets/imagenes/macetero.webp')
  })

  it('normaliza rutas relativas del backend', () => {
    expect(assetUrl('assets/imagenes/macetero.webp')).toBe('/assets/imagenes/macetero.webp')
    expect(assetUrl('imagenes/macetero.webp')).toBe('/assets/imagenes/macetero.webp')
    expect(assetUrl('..\\..\\imagenes\\macetero.webp')).toBe('/assets/imagenes/macetero.webp')
  })
})

describe('hoyISO', () => {
  it('devuelve la fecha local en formato YYYY-MM-DD', () => {
    expect(hoyISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
