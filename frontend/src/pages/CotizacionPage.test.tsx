import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CotizacionPage } from './CotizacionPage'

function renderizarCotizacion() {
  render(
    <MemoryRouter>
      <CotizacionPage />
    </MemoryRouter>,
  )
}

function seleccionarArchivos(archivos: File[]) {
  const input = screen.getByLabelText(/Archivos 3D/i)
  fireEvent.change(input, { target: { files: archivos } })
}

describe('CotizacionPage', () => {
  it('rechaza archivos que no sean .STL o .OBJ', () => {
    renderizarCotizacion()

    seleccionarArchivos([new File(['contenido'], 'modelo.txt', { type: 'text/plain' })])

    expect(screen.getByText(/no es un archivo \.STL o \.OBJ válido/)).toBeInTheDocument()
  })

  it('limita la solicitud a un máximo de cinco archivos 3D', () => {
    renderizarCotizacion()

    const archivos = Array.from(
      { length: 6 },
      (_, indice) => new File(['contenido'], `pieza-${indice}.stl`, { type: 'model/stl' }),
    )
    seleccionarArchivos(archivos)

    expect(screen.getByText(/Puedes adjuntar como máximo 5 archivos/)).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Quitar pieza-/ })).toHaveLength(5)
  })

  it('acepta un archivo .STL válido y lo muestra en la lista', () => {
    renderizarCotizacion()

    seleccionarArchivos([new File(['contenido'], 'macetero.stl', { type: 'model/stl' })])

    expect(screen.getByText(/macetero\.stl/)).toBeInTheDocument()
    expect(screen.queryByText(/no es un archivo/)).not.toBeInTheDocument()
  })
})
