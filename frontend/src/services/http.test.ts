import { describe, expect, it } from 'vitest'
import { ApiError, buildQuery } from './http'

describe('buildQuery', () => {
  it('agrega parámetros simples y arrays', () => {
    expect(
      buildQuery({
        q: 'macetero',
        categorias: ['maceteros', 'figuras'],
        pagina: 0,
        activo: false,
      }),
    ).toBe('?q=macetero&categorias=maceteros&categorias=figuras&pagina=0&activo=false')
  })

  it('omite valores vacíos', () => {
    expect(buildQuery({ q: '', material: undefined, estado: null })).toBe('')
  })

  it('escapa caracteres especiales', () => {
    expect(buildQuery({ q: 'plástico reciclado' })).toBe('?q=pl%C3%A1stico+reciclado')
  })
})

describe('ApiError', () => {
  it('conserva estado y detalles de validación', () => {
    const error = new ApiError(400, 'Datos inválidos', { correo: 'Ya está registrado' })
    expect(error.status).toBe(400)
    expect(error.message).toBe('Datos inválidos')
    expect(error.details?.correo).toBe('Ya está registrado')
  })
})
